# 🗺️ Índice y Mapa de Referencia Técnica — Backend (SERVER_NUBE)

> **Documento:** Mapa conceptual, catálogo de endpoints, arquitectura modular DDD y variables de entorno.  
> **Proyecto:** pERP-2027 · Backend (`BACK`)  
> **Stack Principal:** Node.js (CommonJS) · Fastify v4 · Drizzle ORM · PostgreSQL 18 (`postgres.js`) · Vitest · PM2  
> **Arquitectura:** Vertical Slice Architecture / Domain-Driven Design (DDD)

---

## 📋 Tabla de Contenidos
1. [Estructura del Árbol de Directorios](#1-estructura-del-árbol-de-directorios)
2. [Catálogo Exhaustivo de Endpoints de la API](#2-catálogo-exhaustivo-de-endpoints-de-la-api)
   - [2.1 Salud y Diagnóstico (`/api/health`)](#21-salud-y-diagnóstico-apihealth)
   - [2.2 Autenticación y Sesión (`/api/auth`)](#22-autenticación-y-sesión-apiauth)
   - [2.3 Usuarios y Accesos Multi-Tenant (`/api/usuarios`)](#23-usuarios-y-accesos-multi-tenant-apiusuarios)
   - [2.4 Empresas y Asignación de Módulos (`/api/empresas`)](#24-empresas-y-asignación-de-módulos-apiempresas)
   - [2.5 Sucursales (`/api/sucursales`)](#25-sucursales-apisucursales)
   - [2.6 Almacenes (`/api/almacenes`)](#26-almacenes-apialmacenes)
   - [2.7 Cajas, Turnos y Conciliación (`/api/cajas`)](#27-cajas-turnos-y-conciliación-apicajas)
   - [2.8 Tipos de Comprobante (`/api/tipos-comprobante`)](#28-tipos-de-comprobante-apitipos-comprobante)
   - [2.9 Módulos del Sistema y Backfill (`/api/modulos`)](#29-módulos-del-sistema-y-backfill-apimodulos)
   - [2.10 Roles y Permisos Granulares (`/api/roles`)](#210-roles-y-permisos-granulares-apiroles)
   - [2.11 Permisos del Sistema (`/api/permisos`)](#211-permisos-del-sistema-apipermisos)
   - [2.12 Clientes (`/api/clientes`)](#212-clientes-apiclientes)
   - [2.13 Productos y Catálogo Comercial (`/api/productos`)](#213-productos-y-catálogo-comercial-apiproductos)
   - [2.14 Proveedores (`/api/proveedores`)](#214-proveedores-apiproveedores)
   - [2.15 Control de Stock y Kárdex (`/api/stock`)](#215-control-de-stock-y-kárdex-apistock)
   - [2.16 Combos Promocionales (`/api/combos`)](#216-combos-promocionales-apicombos)
   - [2.17 Pre-Ventas (`/api/preventas`)](#217-pre-ventas-apipreventas)
   - [2.18 Ventas y Facturación (`/api/ventas`)](#218-ventas-y-facturación-apiventas)
   - [2.19 Sincronización Servidor-a-Servidor (`/api/sync`)](#219-sincronización-servidor-a-servidor-apisync)
   - [2.20 Utilidades y Consulta RUC/DNI (`/api/utils`)](#220-utilidades-y-consulta-rucdni-apiutils)
3. [Ubicación de Módulos, Controladores, Servicios y Repositorios](#3-ubicación-de-módulos-controladores-servicios-y-repositorios)
   - [3.1 Capa de Módulos de Dominio (`src/modules/`)](#31-capa-de-módulos-de-dominio-srcmodules)
   - [3.2 Regla de Negocio Crítica: Inactivación Visual (No Physical Delete)](#32-regla-de-negocio-crítica-inactivación-visual-no-physical-delete)
   - [3.3 Capa de Modelos y Base de Datos (`src/db/`)](#33-capa-de-modelos-y-base-de-datos-srcdb)
   - [3.4 Capa de Plugins Fastify (`src/plugins/`)](#34-capa-de-plugins-fastify-srcplugins)
4. [Variables de Entorno Requeridas](#4-variables-de-entorno-requeridas)
5. [Mecanismos Clave de Seguridad y Arquitectura](#5-mecanismos-clave-de-seguridad-y-arquitectura)
6. [Arquitectura Enterprise y Guía de Escalabilidad (`ARQUITECTURA_ESCALABILIDAD.md`)](#6-arquitectura-enterprise-y-guía-de-escalabilidad)

---

## 1. Estructura del Árbol de Directorios

El siguiente diagrama detalla la jerarquía consolidada del backend bajo **Vertical Slice Architecture**:

```text
BACK/
├── .env                         # Variables de entorno activas (ignorado en git)
├── .env.example                 # Plantilla documentada de variables de entorno
├── .gitignore                   # Exclusiones de control de versiones
├── package.json                 # Metadatos del proyecto, dependencias y scripts npm
├── package-lock.json            # Bloqueo de versiones determinista de dependencias
├── drizzle.config.js            # Configuración de Drizzle Kit para PostgreSQL
├── ecosystem.config.js          # Configuración de despliegue en clúster para PM2
├── server.js                    # Punto de entrada de la aplicación (entrypoint HTTP)
├── sync_permisos.js             # Script de backfill CLI para sincronizar permisos de menús
├── run-init.sh                  # Script bash para creación y sembrado de la BD
├── db-init.sql                  # Definiciones DDL iniciales en SQL puro
├── db-seed.sql                  # Datos semilla (SuperAdmin, catálogos SUNAT, afectaciones)
├── ARQUITECTURA_ESCALABILIDAD.md# Especificación de arquitectura DDD vertical y fases
├── backend_index.md             # Este documento de índice y arquitectura
├── README.md                    # Documento de bienvenida del backend
│
├── tests/                       # Pruebas automatizadas con Vitest
│   └── unit/
│       ├── auth_service.test.js      # Pruebas del servicio de autenticación y árbol
│       ├── rbac.permissions.test.js  # Pruebas de autorización RBAC dinámica
│       ├── rls.isolation.test.js     # Pruebas de aislamiento multi-tenant (RLS)
│       └── usuarios.security.test.js # Pruebas de jerarquía de niveles en usuarios
│
└── src/                         # Código fuente del servidor
    ├── app.js                   # Factoría Fastify y registro central de plugins/rutas
    │
    ├── core/                    # Módulos transversales y utilidades base del framework
    │   ├── crud.factory.js      # Generador automatizado de rutas CRUD estándar con RBAC y RLS
    │   ├── generic.service.js   # Servicio genérico reutilizable sobre tablas Drizzle ORM
    │   └── permissions.hook.js  # Hook preHandler recursivo para validación SQL de permisos
    │
    ├── db/                      # Capa de persistencia y esquemas ORM
    │   ├── index.js             # Inicialización de Drizzle con cliente Postgres y esquemas
    │   ├── schema.js            # Definición completa de ~87 esquemas de tablas Drizzle (PG)
    │   ├── relations.js         # Relaciones entre tablas Drizzle
    │   └── migrations/          # Archivos de migración generados por drizzle-kit
    │
    ├── plugins/                 # Plugins modulares de Fastify
    │   ├── auth.js              # Plugin JWT, decorators: authenticate, authenticateApiKey, authorize
    │   ├── cors.js              # Configuración de CORS dinámico por orígenes permitidos
    │   ├── db.js                # Conexión pool a PostgreSQL 18 con verificación al arranque
    │   └── sensible.js          # Integración de @fastify/sensible (HTTP status helpers)
    │
    ├── utils/                   # Utilidades globales del servidor
    │   └── factores.js          # Conversión de factores de precio (x100) y volumen (x1,000,000)
    │
    ├── services/                # Servicios transversales de infraestructura
    │   ├── api_peru_service.js  # Consumo de API externa de RUC/DNI con fallback resiliente
    │   └── auth_service.js      # Lógica de login, refresh, permisos O(1), conmutación de sede y árbol
    │
    ├── workers/                 # Procesos en segundo plano / Cron jobs
    │   └── preventasExpirationWorker.js # Expiración automática de preventas vencidas
    │
    └── modules/                 # 🏛️ Vertical Slices / Dominios de Negocio (DDD)
        ├── auth/                # Módulo de Autenticación y Sesiones
        │   └── auth.routes.js
        │
        ├── caja/                # Dominio de Caja, Arqueos y Turnos
        │   ├── cajas.routes.js
        │   ├── controllers/
        │   │   └── cajas.controller.js
        │   ├── services/
        │   │   ├── cajas.service.js
        │   │   ├── aperturaTurno.service.js   # Caso de uso: Apertura atómica
        │   │   └── cierreTurno.service.js     # Caso de uso: Cierre analítico y arqueo
        │   └── repositories/
        │       └── cajas.repository.js
        │
        ├── clientes/            # Dominio de Clientes y Límites de Crédito
        │   ├── clientes.routes.js
        │   ├── controllers/
        │   │   └── clientes.controller.js
        │   ├── services/
        │   │   └── clientes.service.js
        │   └── repositories/
        │       └── clientes.repository.js
        │
        ├── combos/              # Dominio de Combos Promocionales
        │   ├── combos.routes.js
        │   ├── controllers/
        │   │   └── combos.controller.js
        │   ├── services/
        │   │   └── combos.service.js
        │   └── repositories/
        │       └── combos.repository.js
        │
        ├── manager/             # Dominio de Gestión y Administración Enterprise
        │   ├── gestion.routes.js     # Router agrupador administrativo (/api)
        │   ├── empresas.routes.js, sucursales.routes.js, roles.routes.js, modulos.routes.js, usuarios.routes.js
        │   ├── controllers/
        │   │   ├── empresas.controller.js, sucursales.controller.js, roles.controller.js
        │   │   ├── modulos.controller.js, usuarios.controller.js
        │   ├── services/
        │   │   ├── empresas.service.js, sucursales.service.js, roles.service.js
        │   │   ├── modulos.service.js, usuarios.service.js
        │   └── repositories/
        │       ├── empresas.repository.js, sucursales.repository.js, roles.repository.js
        │       ├── modulos.repository.js, usuarios.repository.js
        │
        ├── productos/           # Dominio de Catálogo de Productos y Presentaciones
        │   ├── productos.routes.js
        │   ├── controllers/
        │   │   └── productos.controller.js
        │   ├── services/
        │   │   └── productos.service.js
        │   └── repositories/
        │       └── productos.repository.js
        │
        ├── proveedores/         # Dominio de Proveedores
        │   ├── proveedores.routes.js
        │   ├── controllers/
        │   │   └── proveedores.controller.js
        │   ├── services/
        │   │   └── proveedores.service.js
        │   └── repositories/
        │       └── proveedores.repository.js
        │
        ├── stock/               # Dominio de Control de Stock y Kárdex
        │   ├── stock.routes.js
        │   ├── controllers/
        │   │   └── stock.controller.js
        │   ├── services/
        │   │   ├── stock.service.js
        │   │   ├── reinicioStock.service.js   # Caso de uso: Reinicio masivo
        │   │   └── cargaMasiva.service.js     # Caso de uso: Inventario inicial por lotes
        │   └── repositories/
        │       ├── stock.repository.js
        │       └── kardex.repository.js
        │
        └── ventas/              # Dominio de Ventas y Pre-Ventas
            ├── ventas.routes.js
            ├── preventas.routes.js
            ├── controllers/
            │   ├── ventas.controller.js
            │   └── preventas.controller.js
            ├── services/
            │   ├── ventas.service.js
            │   ├── registrarVenta.service.js  # Caso de uso: Emisión y cobro atómico
            │   ├── anularVenta.service.js     # Caso de uso: Anulación y reversión de stock
            │   └── preventas.service.js       # Caso de uso: Pedidos previos y combos
            └── repositories/
                ├── ventas.repository.js
                └── preventas.repository.js
```

---

## 2. Catálogo Exhaustivo de Endpoints de la API

### 2.1 Salud y Diagnóstico (`/api/health`)
*Archivo: `src/routes/health.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Pública | Ninguno | Diagnóstico de estado del proceso Node.js y latencia de conexión a PostgreSQL. |

---

### 2.2 Autenticación y Sesión (`/api/auth`)
*Módulo: `src/modules/auth/auth.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Pública | Ninguno | Inicio de sesión con usuario y password. Valida bloqueo por intentos y emite par JWT (`access_token` y `refresh_token`). |
| `POST` | `/api/auth/refresh` | Pública | Ninguno | Emisión de nuevo token de acceso a partir de un refresh token válido. |
| `GET` | `/api/auth/me` | Bearer JWT | Autenticado | Devuelve perfil del usuario activo, acceso actual, empresa y branch. |
| `POST` | `/api/auth/switch-branch` | Bearer JWT | Autenticado | Conmuta la sede activa del usuario, regenera el JWT con los nuevos permisos asignados. |
| `GET` | `/api/auth/menu` | Bearer JWT | Autenticado | Retorna el árbol recursivo de módulos y menús autorizados para la sesión actual. |
| `POST` | `/api/auth/logout` | Bearer JWT | Autenticado | Cierre de sesión e invalidación de token activo. |

---

### 2.3 Usuarios y Accesos Multi-Tenant (`/api/usuarios`)
*Módulo: `src/modules/manager/usuarios.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/usuarios` | Bearer JWT | `usuarios.ver` | Lista usuarios filtrados por RLS de empresa. |
| `GET` | `/api/usuarios/:id` | Bearer JWT | `usuarios.ver` | Obtiene el detalle de un usuario y sus accesos asignados. |
| `POST` | `/api/usuarios` | Bearer JWT | `usuarios.crear` | Crea un usuario con hashing bcrypt y asigna su acceso por defecto bajo jerarquía de nivel. |
| `PUT` | `/api/usuarios/:id` | Bearer JWT | `usuarios.editar` | Actualiza datos del usuario, password (si aplica) y roles respetando jerarquía. |
| `DELETE` | `/api/usuarios/:id` | Bearer JWT | `usuarios.eliminar` | **Inactivación visual:** Cambia `activo = false` en `usuarios` y `usuario_accesos`. |

---

### 2.4 Empresas y Asignación de Módulos (`/api/empresas`)
*Módulo: `src/modules/manager/empresas.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/empresas` | Bearer JWT | `empresas.ver` | Lista empresas activas. SuperAdmin visualiza todas; tenant solo la suya. |
| `GET` | `/api/empresas/:id` | Bearer JWT | `empresas.ver` | Detalle de empresa con módulos habilitados. |
| `POST` | `/api/empresas` | Bearer JWT | `empresas.crear` | Crea empresa en transacción atómica generando automáticamente sucursal principal y almacén base. |
| `PUT` | `/api/empresas/:id` | Bearer JWT | `empresas.editar` | Actualiza datos fiscales y configuración de módulos asignados. |
| `DELETE` | `/api/empresas/:id` | Bearer JWT | `empresas.eliminar` | **Inactivación visual:** Cambia `activo = false` en la empresa y sus sedes vinculadas. |

---

### 2.5 Sucursales (`/api/sucursales`)
*Módulo: `src/modules/manager/sucursales.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/sucursales` | Bearer JWT | `sucursales.ver` | Lista sucursales por empresa con credenciales SIRE y ubigeo. |
| `GET` | `/api/sucursales/:id` | Bearer JWT | `sucursales.ver` | Detalle de una sucursal específica. |
| `POST` | `/api/sucursales` | Bearer JWT | `sucursales.crear` | Registra una nueva sucursal y su almacén asociado. |
| `PUT` | `/api/sucursales/:id` | Bearer JWT | `sucursales.editar` | Actualiza datos de la sucursal y configuración SIRE SUNAT. |
| `DELETE` | `/api/sucursales/:id` | Bearer JWT | `sucursales.eliminar` | **Inactivación visual:** Cambia `activo = false` en la sucursal. |

---

### 2.6 Almacenes (`/api/almacenes`)
*Hub: `src/routes/gestion.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/almacenes` | Bearer JWT | `almacenes.ver` | Lista almacenes físicos por sucursal. |
| `POST` | `/api/almacenes` | Bearer JWT | `almacenes.crear` | Registra un nuevo almacén. |
| `PUT` | `/api/almacenes/:id` | Bearer JWT | `almacenes.editar` | Actualiza nombre, dirección o estado del almacén. |
| `DELETE` | `/api/almacenes/:id` | Bearer JWT | `almacenes.eliminar` | **Inactivación visual:** Cambia `activo = false`. |

---

### 2.7 Cajas, Turnos y Conciliación (`/api/cajas`)
*Módulo: `src/modules/caja/cajas.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/cajas` | Bearer JWT | `cajas.ver` | Lista series de facturación y correlativos por caja/sucursal. |
| `GET` | `/api/cajas/configuradas` | Bearer JWT | `cajas.ver` | Agrupación estructurada de cajas físicas y series activas. |
| `POST` | `/api/cajas` | Bearer JWT | `cajas.crear` | Registra una serie y correlativo asignado a caja. |
| `PUT` | `/api/cajas/:id` | Bearer JWT | `cajas.editar` | Actualiza parámetros de la serie de caja. |
| `DELETE` | `/api/cajas/:id` | Bearer JWT | `cajas.eliminar` | **Inactivación visual:** Cambia `activo = false` en la serie. |
| `GET` | `/api/cajas/turnos` | Bearer JWT | `cajas.ver` | Listado histórico de turnos con montos formateados. |
| `GET` | `/api/cajas/turnos/activo` | Bearer JWT | `cajas.ver` | Consulta el turno abierto del usuario actual y saldos esperados. |
| `GET` | `/api/cajas/turnos/:id` | Bearer JWT | `cajas.ver` | Detalle analítico del turno (ventas, pagos, arqueos, resumen). |
| `POST` | `/api/cajas/turnos/apertura` | Bearer JWT | `cajas.crear` | **Apertura de turno:** Inserción atómica en `caja_turnos`, inicialización de `caja_turnos_resumen` y `caja_turno_pagos`. |
| `GET` | `/api/cajas/turnos/:id/movimientos` | Bearer JWT | `cajas.ver` | Lista ingresos y egresos manuales de efectivo. |
| `POST` | `/api/cajas/turnos/:id/movimientos` | Bearer JWT | `cajas.crear` | Registra movimiento manual con validación de saldo disponible y desglose de arqueo. |
| `GET` | `/api/cajas/movimientos/:movimientoId/arqueo` | Bearer JWT | `cajas.ver` | Obtiene el conteo de billetes/monedas del movimiento. |
| `GET` | `/api/cajas/turnos/:id/arqueos` | Bearer JWT | `cajas.ver` | Lista arqueos físicos realizados en el turno. |
| `POST` | `/api/cajas/turnos/:id/cierre` | Bearer JWT | `cajas.editar` | **Cierre y Conciliación:** Valida `VAL-DUR-02`, concilia ventas vs dinero declarado, genera resumen fiscal y asienta denominaciones. |

---

### 2.8 Tipos de Comprobante (`/api/tipos-comprobante`)
*Hub: `src/routes/gestion.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/tipos-comprobante` | Bearer JWT | Autenticado | Catálogo SUNAT (01 Factura, 03 Boleta, 07 NC, 08 ND, 09 Guía, VL Vale). |

---

### 2.9 Módulos del Sistema y Backfill (`/api/modulos`)
*Módulo: `src/modules/manager/modulos.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/modulos` | Bearer JWT | `modulos.ver` | Lista módulos en orden jerárquico. |
| `GET` | `/api/modulos/tree` | Bearer JWT | `modulos.ver` | Retorna árbol recursivo de módulos y acciones hijas. |
| `POST` | `/api/modulos` | Bearer JWT | `modulos.crear` | Crea módulo o acción e inserta automáticamente permisos CRUD asociados. |
| `PUT` | `/api/modulos/:id` | Bearer JWT | `modulos.editar` | Actualiza nombre, ruta, icono o posición en el menú. |
| `DELETE` | `/api/modulos/:id` | Bearer JWT | `modulos.eliminar` | **Inactivación visual:** Cambia `activo = false` en cascada. |

---

### 2.10 Roles y Permisos Granulares (`/api/roles`)
*Módulo: `src/modules/manager/roles.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/roles` | Bearer JWT | `roles.ver` | Lista roles de la empresa respetando jerarquía de nivel. |
| `GET` | `/api/roles/:id` | Bearer JWT | `roles.ver` | Detalle del rol y array de `permisos_ids` asignados. |
| `POST` | `/api/roles` | Bearer JWT | `roles.crear` | Crea rol con validación de nivel de jerarquía y asigna permisos. |
| `PUT` | `/api/roles/:id` | Bearer JWT | `roles.editar` | Actualiza datos del rol y sincroniza tabla `rol_permisos`. |
| `DELETE` | `/api/roles/:id` | Bearer JWT | `roles.eliminar` | **Inactivación visual:** Cambia `activo = false` (impide borrar roles del sistema). |

---

### 2.11 Permisos del Sistema (`/api/permisos`)
*Hub: `src/routes/gestion.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/permisos` | Bearer JWT | `roles.ver` | Catálogo de permisos individuales (`modulo.accion`) para asignación de roles. |

---

### 2.12 Clientes (`/api/clientes`)
*Módulo: `src/modules/clientes/clientes.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/clientes` | Bearer JWT | `clientes.ver` | Listado de clientes con RLS, cálculo de crédito disponible y filtros. |
| `GET` | `/api/clientes/:id` | Bearer JWT | `clientes.ver` | Obtiene cliente específico con desglose de saldo utilizado y disponible. |
| `POST` | `/api/clientes` | Bearer JWT | `clientes.crear` | Registra cliente validando unicidad de documento y convirtiendo montos a céntimos. |
| `PUT` | `/api/clientes/:id` | Bearer JWT | `clientes.editar` | Actualiza datos de contacto y condiciones comerciales de crédito. |
| `DELETE` | `/api/clientes/:id` | Bearer JWT | `clientes.eliminar` | **Inactivación visual:** Asigna `estado_credito = 'INACTIVO'` sin borrado físico. |

---

### 2.13 Productos y Catálogo Comercial (`/api/productos`)
*Módulo: `src/modules/productos/productos.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/productos` | Bearer JWT | `productos.ver` | Lista productos con sus presentaciones y stocks por sede en tiempo real. |
| `GET` | `/api/productos/:id` | Bearer JWT | `productos.ver` | Detalle completo de producto y desglose de presentaciones comerciales. |
| `POST` | `/api/productos` | Bearer JWT | `productos.crear` | Crea producto y presentaciones en transacción atómica con validación de código de barras. |
| `PUT` | `/api/productos/:id` | Bearer JWT | `productos.editar` | Actualiza cabecera de producto y sincroniza presentaciones. |
| `DELETE` | `/api/productos/:id` | Bearer JWT | `productos.eliminar` | **Inactivación visual:** Cambia `activo = false` en `productos` y `presentaciones`. |

---

### 2.14 Proveedores (`/api/proveedores`)
*Módulo: `src/modules/proveedores/proveedores.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/proveedores` | Bearer JWT | `proveedores.ver` | Lista proveedores con joins a tabla `ubigeo`. |
| `GET` | `/api/proveedores/:id` | Bearer JWT | `proveedores.ver` | Detalle individual de proveedor. |
| `POST` | `/api/proveedores` | Bearer JWT | `proveedores.crear` | Registra proveedor validando formato y unicidad de RUC. |
| `PUT` | `/api/proveedores/:id` | Bearer JWT | `proveedores.editar` | Actualiza datos comerciales y contacto del proveedor. |
| `DELETE` | `/api/proveedores/:id` | Bearer JWT | `proveedores.eliminar` | **Inactivación visual:** Cambia `activo = false`. |

---

### 2.15 Control de Stock y Kárdex (`/api/stock`)
*Módulo: `src/modules/stock/stock.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/stock/actual` | Bearer JWT | `stock.ver` | Consulta consolidada de saldos en `stock_actual` formateada con factores visuales. |
| `GET` | `/api/stock/kardex` | Bearer JWT | `stock.ver` | Historial de movimientos de inventario (entradas, salidas, ajustes, ventas, compras). |
| `POST` | `/api/stock/reinicio` | Bearer JWT | `stock.crear` | **Reinicio de Stock:** Caso de uso transaccional que asienta en cero el stock actual y registra auditoría en Kárdex. |
| `POST` | `/api/stock/carga-masiva` | Bearer JWT | `stock.crear` | **Carga Masiva:** Importación por lotes de saldos iniciales con validación de producto y presentación. |

---

### 2.16 Combos Promocionales (`/api/combos`)
*Módulo: `src/modules/combos/combos.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/combos` | Bearer JWT | `combos.ver` | Listado de combos con stock virtual dinámico calculado a partir de componentes. |
| `GET` | `/api/combos/:id` | Bearer JWT | `combos.ver` | Detalle del combo con desglose de sub-productos y fórmulas de precio. |
| `POST` | `/api/combos` | Bearer JWT | `combos.crear` | Registra combo virtual, crea presentación principal y asienta componentes en `combo_detalles`. |
| `PUT` | `/api/combos/:id` | Bearer JWT | `combos.editar` | Actualiza cabecera del combo y sustituye componentes atómicamente. |
| `PATCH` | `/api/combos/:id` | Bearer JWT | `combos.editar` | Alterna estado activo/inactivo del combo. |
| `DELETE` | `/api/combos/:id` | Bearer JWT | `combos.eliminar` | **Inactivación visual:** Cambia `activo = false` en combo y sus presentaciones. |

---

### 2.17 Pre-Ventas (`/api/preventas`)
*Módulo: `src/modules/ventas/preventas.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/preventas` | Bearer JWT | Autenticado | Lista preventas de la sucursal (por defecto en estado `PENDIENTE`). |
| `GET` | `/api/preventas/:id` | Bearer JWT | Autenticado | Detalle completo de preventa con ítems y desglose previsto de combos. |
| `POST` | `/api/preventas` | Bearer JWT | Autenticado | Genera pedido previo sin afectar stock físico y registra `combo_detalle_pre_ventas`. |
| `PUT` | `/api/preventas/:id` | Bearer JWT | Autenticado | Modifica preventa mientras mantenga estado `PENDIENTE`. |
| `DELETE` | `/api/preventas/:id` | Bearer JWT | Autenticado | **Inactivación visual:** Actualiza `estado = 'ANULADO'` impidiendo borrado físico. |

---

### 2.18 Ventas y Facturación (`/api/ventas`)
*Módulo: `src/modules/ventas/ventas.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/ventas` | Bearer JWT | Autenticado | Listado histórico de ventas con filtros de fecha, tipo de comprobante, cliente y búsqueda. |
| `GET` | `/api/ventas/:id` | Bearer JWT | Autenticado | Consulta detallada de venta con desglose tributario, métodos de pago y combo detalle. |
| `POST` | `/api/ventas` | Bearer JWT | Autenticado | **Emisión y Cobro Atómico:** Bloqueo `FOR UPDATE` de serie/correlativo, validaciones fiscales SUNAT ($\ge 700$), turno de caja activo, descuento de stock en almacén y Kárdex, pagos y cierre de preventa. |
| `POST` | `/api/ventas/:id/anular` | Bearer JWT | Autenticado | **Anulación y Reversión:** Marca `estado = 'ANULADO'` y restituye atómicamente el stock en `stock_actual` y `stock` (Kárdex `tipo_mov: 1 = Entrada`). |

---

### 2.19 Sincronización Servidor-a-Servidor (`/api/sync`)
*Archivo: `src/routes/sync.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/sync/push` | API Key (`x-api-key`) | Servidor Nube/Local | Aplica modificaciones generadas en nodos locales mediante estrategia Last-Write-Wins. |
| `GET` | `/api/sync/pull` | API Key (`x-api-key`) | Servidor Nube/Local | Descarga cambios generados en la nube a partir de una marca temporal (`?since=<timestamp>`). |
| `GET` | `/api/sync/status` | Bearer JWT | Autenticado | Informa el estado y frecuencia del motor de sincronización. |

---

### 2.20 Utilidades y Consulta RUC/DNI (`/api/utils`)
*Archivo: `src/routes/utils.routes.js`* · *Servicio: `src/services/api_peru_service.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/utils/consulta-documento/:tipo/:numero` | Bearer JWT | Autenticado | Consulta en tiempo real los datos oficiales de un RUC (SUNAT) o DNI (RENIEC) con fallback automático. |

---

## 3. Ubicación de Módulos, Controladores, Servicios y Repositorios

El backend implementa el patrón **Vertical Slice Architecture** por dominios delimitados:

```
Fastify Router (module.routes.js) ──► Controller (HTTP/Status) ──► Service (Business Logic / Tx) ──► Repository (Drizzle ORM)
```

### 3.1 Capa de Módulos de Dominio (`src/modules/`)
Cada módulo encapsula sus responsabilidades sin acoplamientos horizontales rígidos:
1. **`routes.js`**: Declaración pura de rutas, validaciones y hooks de autorización Fastify.
2. **`controllers/`**: Mapeo de parámetros HTTP, invocación al servicio y respuestas semánticas (`200`, `201`, `400`, `404`, `500`).
3. **`services/`**: Casos de uso especializados, reglas de cálculo, transacciones atómicas `db.transaction()` y orquestación.
4. **`repositories/`**: Consultas Drizzle ORM parametrizadas con inyección segura de RLS y joins eficientes.

### 3.2 Regla de Negocio Crítica: Inactivación Visual (No Physical Delete)
> [!IMPORTANT]
> **En todo el ERP está terminantemente prohibido el borrado físico (`DELETE FROM`) en tablas maestras o transaccionales.**
> Todas las operaciones de eliminación operan como **Soft Delete / Inactivación Visual**:
> - En entidades con columna `activo`: `UPDATE ... SET activo = false, updated_at = NOW()`.
> - En `clientes`: `UPDATE ... SET estado_credito = 'INACTIVO', updated_at = NOW()`.
> - En `ventas` y `pre_ventas`: `UPDATE ... SET estado = 'ANULADO', updated_at = NOW()`.

---

## 4. Variables de Entorno Requeridas

| Variable | Tipo | Requerida | Valor por Defecto / Ejemplo | Propósito y Descripción |
| :--- | :---: | :---: | :--- | :--- |
| `PORT` | Numérico | No | `5000` | Puerto TCP en el que escucha Fastify. |
| `NODE_ENV` | String | Sí | `production` / `development` | Entorno de ejecución de Node.js. |
| `LOG_LEVEL` | String | No | `info` | Nivel mínimo de detalle para Pino Logger. |
| `DATABASE_URL` | String | **Sí** | `postgresql://user:pass@host:5432/db` | Cadena de conexión para PostgreSQL 18 consumida por Drizzle ORM. |
| `JWT_SECRET` | String | **Sí** | *Cadena criptográfica extensa* | Clave secreta simétrica para firmar y verificar tokens JWT. |
| `JWT_EXPIRES_IN` | String | No | `15m` (o `8h` en dev) | Tiempo de expiración del token de acceso (`access_token`). |
| `REFRESH_TOKEN_EXPIRES_IN` | String | No | `7d` | Tiempo de vida útil del refresh token. |
| `CORS_ORIGINS` | String | **Sí** | `http://localhost:5175,http://127.0.0.1:5175` | Lista separada por comas de los orígenes frontend autorizados. |
| `SYNC_API_KEY` | String | **Sí** | *Clave secreta compartida* | Clave de cabecera `x-api-key` requerida por las rutas `/api/sync`. |
| `SYNC_INTERVAL_SECONDS` | Numérico | No | `30` | Intervalo de referencia en segundos para sincronización. |
| `API_PERU_URL` | String | No | `https://prorucdni.mifacturaperu.com` | URL base del microservicio primario para consulta RUC/DNI. |
| `API_PERU_TOKEN` | String | No | *Token de autenticación API* | Token Bearer de autorización para consultar la API de RUC/DNI. |
| `TZ` | String | No | `America/Lima` | Zona horaria del sistema para marcas de tiempo. |

---

## 5. Mecanismos Clave de Seguridad y Arquitectura

### 5.1 Aislamiento Multi-Tenant (Row-Level Security - RLS)
- Filtrado estricto por `empresa_id` y `branch_id` inyectados desde la sesión activa (`request.user`).
- El usuario `es_super_admin` tiene visibilidad global para tareas de soporte y gestión.

### 5.2 Jerarquía Inversa de Roles
- Nivel numérico donde a menor valor mayor jerarquía (`1` = Propietario / SuperAdmin, `50` = Administrador, `100` = Vendedor).
- Se prohíbe crear o modificar usuarios con nivel igual o superior al del usuario autenticado.

### 5.3 Autorización en Tiempo Constante $O(1)$
- El decorador `fastify.authorize` valida el conjunto de permisos precargado en memoria en el JWT, garantizando rendimiento extremo en operaciones de alta frecuencia.

### 5.4 Control de Concurrencia y Transacciones Atómicas
- Bloqueo pesimista `FOR UPDATE` en asignación de correlativos de comprobantes para evitar saltos o duplicidades ante ráfagas de ventas simultáneas.
- Ejecución atómica de compras, ventas y aperturas/cierres en bloques `db.transaction()`.

---

## 6. Arquitectura Enterprise y Guía de Escalabilidad

Para consultar las especificaciones técnicas completas del refactoring y evolución modular hacia millones de transacciones:
👉 **[ARQUITECTURA_ESCALABILIDAD.md](ARQUITECTURA_ESCALABILIDAD.md)**
