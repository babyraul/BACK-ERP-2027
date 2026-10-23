# 🏛️ Arquitectura Empresarial y Guía de Escalabilidad — pERP-2027 (Backend)

> **Documento:** Plan Maestro de Arquitectura, Rendimiento para Millones de Registros y Hoja de Ruta de Refactorización.  
> **Proyecto:** pERP-2027 · Backend (`BACK`)  
> **Stack Base:** Node.js (CommonJS) · Fastify v4 · Drizzle ORM · PostgreSQL 18 (`postgres.js`) · Vitest · PM2  
> **Fecha:** Octubre 2026  

---

## 🎯 Objetivo y Visión

Este documento establece las pautas de ingeniería para transformar el backend de **pERP-2027** en un ERP de clase empresarial, preparado para:
1. Soportar **millones de registros** en tablas de alto tráfico (Kárdex, Ventas, Detalles, Asientos Contables).
2. Procesar transacciones concurrentes en múltiples sucursales sin condiciones de carrera (*race conditions*) ni bloqueos prolongados (*deadlocks*).
3. Evitar el "código intocable" (*monolithic spaghetti routes*) desacoplando transporte HTTP, lógica de dominio y persistencia.
4. Mantener tiempos de respuesta de API `< 100ms` en consultas y evitar *HTTP 504 Gateway Timeouts* en operaciones masivas.

---

## ⚠️ Diagnóstico de la Arquitectura Actual

| Aspecto | Estado Actual | Riesgo a Escala Empresarial |
| :--- | :--- | :--- |
| **Capa de Rutas (`routes/`)** | Rutas monolíticas (ej. `stock.routes.js` con >1,100 líneas) con transporte, validación, matemática de negocio y SQL combinados. | Viola SRP (*Single Responsibility Principle*). Dificulta pruebas unitarias aisladas y reutilización desde workers o scripts CLI. |
| **Agregación en Memoria (Node.js)** | Consultas globales (`GET /api/stock`) traen miles de filas a RAM y ejecutan bucles `forEach` para consolidar saldos y factores. | Cuello de botella en el *Event Loop*. Con catálogos >10,000 productos y >30,000 presentaciones, satura la memoria del proceso Node.js. |
| **Operaciones Masivas N+1** | Endpoints como `/carga-masiva` ejecutan consultas y bloqueos secuenciales dentro de un bucle `for` (`SELECT ... FOR UPDATE` + `INSERT` + `UPDATE`). | Tiempos de transacción de 10 a 30 segundos. Bloqueo de conexiones en el pool de PostgreSQL y congelamiento de ventas en vivo. |
| **Paginación** | Consultas sin límites estrictos (`LIMIT` / `OFFSET` ausentes en catálogos y kárdex). | Caídas por *Out of Memory* (OOM) en clientes y servidor ante empresas con alta densidad de movimientos. |

---

## 🏗️ Los 5 Pilares de Arquitectura Enterprise

```
                                  [ CLIENTE / POS / FRONT ]
                                              │ (HTTP / JWT)
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FASTIFY API GATEWAY                                  │
│  - Autenticación JWT / API Key                                                         │
│  - RBAC Granular (Permisos) + RLS Context (Tenant / Branch)                           │
│  - Validación de Schemas JSON (Fastify / Zod / TypeBox)                                │
│  - Idempotencia HTTP (Idempotency-Key)                                                 │
└───────────────────────┬────────────────────────────────────────┬───────────────────────┘
                        │                                        │
           [ Peticiones Síncronas < 200ms ]         [ Tareas Pesadas > 500 ítems ]
                        │                                        │
                        ▼                                        ▼
┌──────────────────────────────────────────────┐ ┌───────────────────────────────────────┐
│              CAPA DE SERVICIOS               │ │          BACKGROUND WORKERS           │
│  - Reglas de Dominio / Casos de Uso         │ │  - BullMQ (Redis) / PgBoss (Postgres) │
│  - Transacciones ACID Cortas (< 50ms)        │ │  - Importación Masiva de Inventarios  │
│  - Cálculos de Factores y Saldos             │ │  - Generación de XML SUNAT y Libros   │
└───────────────────────┬──────────────────────┘ └───────────────────┬───────────────────┘
                        │                                            │
                        ▼                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              POSTGRESQL 18 (PERSISTENCIA)                              │
│  - Particionamiento de Tablas por Tiempo/Sucursal (Kárdex, Ventas)                     │
│  - Vistas Materializadas y Agregaciones SQL (SUM, GROUP BY)                            │
│  - Operaciones en Lote (Batching / Upsert)                                             │
│  - Réplicas de Lectura (Read Replicas para Reportes)                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Hoja de Ruta de Implementación en 4 Fases

---

### 🔹 FASE 1: Desacoplamiento y Modularización por Dominios (Inmediata)

**Objetivo:** Extraer la lógica transaccional de los archivos de rutas hacia servicios y repositorios puros.

#### Estructura de Directorios Recomendada (Vertical Slice / DDD Pragmático)
En lugar de una estructura horizontal plana, organizar por contextos de negocio delimitados (*Bounded Contexts*):

```text
BACK/src/modules/
├── inventario/
│   ├── inventario.routes.js        # Declaración pura de endpoints Fastify (< 80 líneas)
│   ├── inventario.schemas.js       # Validación de payloads y queries (TypeBox / Fastify Schema)
│   ├── controllers/
│   │   └── inventario.controller.js # Mapeo HTTP request -> Service -> reply
│   ├── services/
│   │   ├── stock.service.js        # Lógica de saldos, consolidación y cálculos
│   │   ├── reinicioStock.service.js # Caso de uso: Reinicio masivo atómico
│   │   └── cargaMasiva.service.js   # Caso de uso: Carga masiva e inventario físico
│   └── repositories/
│       ├── stock.repository.js     # Consultas Drizzle ORM a tabla stock_actual
│       └── kardex.repository.js    # Consultas e inserciones a tabla stock (histórico)
│
├── ventas/
├── facturacion/
└── contabilidad/
```

#### Regla de Implementación de la Fase 1
1. **La Ruta (`.routes.js`) solo hace:** `fastify.post('/ruta', { schema, config }, controller.metodo)`.
2. **El Controlador (`.controller.js`) solo hace:** Extrae `req.body`, `req.user`, llama al servicio y retorna el código HTTP (`200`, `201`, `400`).
3. **El Servicio (`.service.js`) contiene la lógica:** Maneja la transacción `db.transaction()`, validaciones de negocio, y no conoce nada de Fastify (`request` ni `reply`). Esto permite probarlo con Vitest en memoria.

---

### 🔹 FASE 2: Optimización de Base de Datos y Paginación (Mediano Plazo)

**Objetivo:** Eliminar agregaciones en Node.js y garantizar que consultas con 1,000,000 de registros respondan en < 50ms.

#### 1. Paginación Obligatoria en Todos los Listados
Ningún endpoint de listado (`GET`) debe retornar colecciones abiertas.
* Usar `limit` (por defecto 50, máximo 200) y `offset` (o paginación basada en cursor para kárdex).
* Retornar metadatos estándar:
  ```json
  {
    "success": true,
    "data": [ ... ],
    "pagination": {
      "total": 45890,
      "page": 1,
      "limit": 50,
      "totalPages": 918
    }
  }
  ```

#### 2. Agregación en SQL en lugar de Node.js
Reemplazar la carga masiva a memoria de `GET /api/stock` por una consulta SQL con `JOIN`, `GROUP BY` y agregación directa:
```sql
SELECT 
    p.id AS producto_id,
    p.nombre,
    p.codigo,
    COALESCE(SUM(sa.saldo_actual), 0) AS saldo_total_base,
    pr.id AS presentacion_id,
    pr.nombre AS presentacion_nombre,
    pr.multiplica_por,
    FLOOR(COALESCE(SUM(sa.saldo_actual), 0) / NULLIF(pr.multiplica_por, 0)) AS saldo_presentacion
FROM productos p
LEFT JOIN presentaciones pr ON pr.producto_uuid = p.id
LEFT JOIN stock_actual sa ON sa.producto_id = p.id AND sa.almacen_id = :almacenId
WHERE p.empresa_id = :empresaId AND p.activo = true
GROUP BY p.id, pr.id
ORDER BY p.es_combo DESC, p.nombre ASC
LIMIT :limit OFFSET :offset;
```

#### 3. Particionamiento de Tablas de Alto Crecimiento (PostgreSQL 18)
La tabla histórica `stock` (kárdex) superará rápidamente los 5 millones de registros en producción. Se debe particionar nativamente por rango de fecha:
```sql
-- Tabla principal particionada
CREATE TABLE stock_particionado (
    id UUID NOT NULL,
    producto_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    cantidad NUMERIC,
    saldo NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partición por año/mes
CREATE TABLE stock_y2026m10 PARTITION OF stock_particionado
    FOR VALUES FROM ('2026-10-01 00:00:00') TO ('2026-11-01 00:00:00');
```
* **Impacto:** Consultar el Kárdex de un mes escanea **únicamente la partición de ese mes**, ignorando millones de registros históricos antiguos.

---

### 🔹 FASE 3: Operaciones en Lote (Batching & Bulk Operations)

**Objetivo:** Reducir tiempos de procesamiento en Carga Masiva de 15 segundos a < 300ms eliminando el antipatrón de queries N+1.

#### Cómo transformar el bucle secuencial en Carga Masiva:
En lugar de:
```javascript
// ❌ ANTIPATRÓN: N queries por cada elemento en el bucle
for (const item of items) {
  await tx.select().from(presentaciones)...
  await tx.select().from(stock_actual).for('update')...
  await tx.update(stock_actual)...
  await tx.insert(stock)...
}
```

Aplicar **Bulk Processing**:
```javascript
// ✅ PATRÓN ENTERPRISE: Batching en 3 pasos
// 1. Cargar todas las presentaciones y filas de stock_actual necesarias en 2 queries únicas
const prodIds = items.map(i => i.producto_id);
const [todasPresentaciones, filasStockActual] = await Promise.all([
  tx.select().from(schema.presentaciones).where(inArray(schema.presentaciones.producto_uuid, prodIds)),
  tx.select().from(schema.stock_actual).where(inArray(schema.stock_actual.producto_id, prodIds)).for('update')
]);

// 2. Calcular los deltas en memoria en microsegundos
const updatesStockActual = [];
const insertsKardex = [];

for (const item of items) {
  // Lógica matemática pura en memoria sin round-trips a la BD
  // Construir objetos para inserción/actualización masiva
}

// 3. Persistir en la BD con operaciones masivas
if (insertsKardex.length > 0) {
  await tx.insert(schema.stock).values(insertsKardex); // Bulk insert único
}
```

---

### 🔹 FASE 4: Procesamiento Asíncrono y Resiliencia Empresarial

**Objetivo:** Proteger el servidor HTTP frente a cargas extremas y desconexiones de red.

#### 1. Cola de Trabajos en Segundo Plano (Job Queues)
Para tareas con más de 500 ítems o generación de reportes tributarios/SUNAT:
* Utilizar **BullMQ** (apoyado en Redis) o **PgBoss** (cola ligera nativa sobre PostgreSQL sin infraestructura extra).
* **Flujo Asíncrono:**
  1. Frontend hace `POST /api/stock/carga-masiva` (payload de 3,000 ítems).
  2. Fastify responde de inmediato:
     ```json
     {
       "success": true,
       "status": "PROCESANDO",
       "jobId": "job_94829384",
       "message": "La carga masiva se está procesando en segundo plano."
     }
     ```
  3. Un worker independiente procesa los lotes en *chunks* de 500.
  4. Al finalizar, notifica vía WebSocket o SSE (*Server-Sent Events*) al frontend.
  5. **Resultado:** Ninguna caja o venta se congela mientras se procesa un inventario masivo.

#### 2. Idempotencia en Pagos y Movimientos Contables
Para evitar duplicación de ventas por fallas de red en puntos de venta:
* Exigir el header `Idempotency-Key: <UUID>` en endpoints críticos (`/api/ventas`, `/api/stock/ajuste`).
* Un middleware en Fastify almacena la clave en caché (Redis o tabla de tokens de idempotencia). Si la misma clave llega en menos de 2 minutos, devuelve la respuesta guardada sin reejecutar la transacción contable.

---

## 📋 Matriz de Prioridad de Ejecución

| Tarea | Prioridad | Impacto | Esfuerzo |
| :--- | :---: | :---: | :---: |
| **Separar `stock.routes.js` en Controller + Service** | 🔴 Alta | Alto (Mantenibilidad / Cero "Código Intocable") | 1 día |
| **Implementar Batching en `cargaMasiva`** | 🔴 Alta | Crítico (Elimina bloqueos en BD) | 1 día |
| **Paginación (`limit`, `offset`) en `GET /api/stock`** | 🟡 Media | Alto (Protege memoria RAM del servidor) | 1 día |
| **Trasladar saldos consolidados a consulta SQL directa** | 🟡 Media | Alto (Rendimiento 10x) | 2 días |
| **Implementar Worker de segundo plano (PgBoss)** | 🟢 Planificada | Escalabilidad Enterprise (> 100k transacciones/día) | 3 días |
| **Particionamiento de tabla `stock` en PostgreSQL** | 🟢 Planificada | Escalabilidad a largo plazo (> 5M filas) | 2 días |

---

> **Conclusión:** La solidez matemática y transaccional actual de pERP-2027 es correcta y segura. Siguiendo este plan de 4 fases, la aplicación mantendrá esa exactitud contable mientras escala a niveles de millones de operaciones corporativas sin fricciones.
