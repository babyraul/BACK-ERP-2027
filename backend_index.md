# 🗺️ Índice y Mapa de Referencia Técnica — Backend (SERVER_NUBE)

> **Documento:** Mapa conceptual, catálogo de endpoints, arquitectura y variables de entorno.  
> **Proyecto:** pERP-2027 · Backend (`BACK`)  
> **Stack Principal:** Node.js (CommonJS) · Fastify v4 · Drizzle ORM · PostgreSQL 18 (`postgres.js`) · Vitest · PM2

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
   - [2.7 Cajas y Series de Facturación (`/api/cajas`)](#27-cajas-y-series-de-facturación-apicajas)
   - [2.8 Tipos de Comprobante (`/api/tipos-comprobante`)](#28-tipos-de-comprobante-apitipos-comprobante)
   - [2.9 Módulos del Sistema y Backfill (`/api/modulos`)](#29-módulos-del-sistema-y-backfill-apimodulos)
   - [2.10 Roles y Permisos Granulares (`/api/roles`)](#210-roles-y-permisos-granulares-apiroles)
   - [2.11 Permisos del Sistema (`/api/permisos`)](#211-permisos-del-sistema-apipermisos)
   - [2.12 Clientes (`/api/clientes`)](#212-clientes-apiclientes)
   - [2.13 Productos (`/api/productos`)](#213-productos-apiproductos)
   - [2.14 Ventas (`/api/ventas`)](#214-ventas-apiventas)
   - [2.15 Sincronización Servidor-a-Servidor (`/api/sync`)](#215-sincronización-servidor-a-servidor-apisync)
   - [2.16 Utilidades y Consulta RUC/DNI (`/api/utils`)](#216-utilidades-y-consulta-rucdni-apiutils)
3. [Ubicación de Controladores, Modelos y Rutas](#3-ubicación-de-controladores-modelos-y-rutas)
   - [3.1 Capa de Rutas (`src/routes/`)](#31-capa-de-rutas-srcroutes)
   - [3.2 Capa de Controladores y Lógica de Negocio (`src/controllers/`, `src/services/`, `src/core/`)](#32-capa-de-controladores-y-lógica-de-negocio)
   - [3.3 Capa de Modelos y Base de Datos (`src/db/`)](#33-capa-de-modelos-y-base-de-datos-srcdb)
   - [3.4 Capa de Plugins Fastify (`src/plugins/`)](#34-capa-de-plugins-fastify-srcplugins)
4. [Variables de Entorno Requeridas](#4-variables-de-entorno-requeridas)
5. [Mecanismos Clave de Seguridad y Arquitectura](#5-mecanismos-clave-de-seguridad-y-arquitectura)

---

## 1. Estructura del Árbol de Directorios

El siguiente diagrama detalla la jerarquía de archivos y carpetas del subdirectorio `BACK/`:

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
├── README.md                    # Documento de bienvenida del backend
│
├── tests/                       # Pruebas automatizadas con Vitest
│   └── unit/
│       ├── auth_service.test.js      # Pruebas unitarias del servicio de autenticación y árbol
│       ├── rbac.permissions.test.js  # Pruebas de autorización RBAC dinámica
│       ├── rls.isolation.test.js     # Pruebas de aislamiento multi-tenant (Row-Level Security)
│       └── usuarios.security.test.js # Pruebas de jerarquía de niveles y seguridad en usuarios
│
└── src/                         # Código fuente del servidor
    ├── app.js                   # Factoría de la instancia Fastify y registro central de plugins/rutas
    │
    ├── controllers/             # Directorio reservado para controladores dedicados desacoplados
    │
    ├── core/                    # Módulos transversales y utilidades base del framework
    │   ├── crud.factory.js      # Generador automatizado de rutas CRUD estándar con RBAC y RLS
    │   ├── generic.service.js   # Servicio genérico reutilizable sobre tablas Drizzle ORM
    │   └── permissions.hook.js  # Hook preHandler recursivo para validación SQL de permisos
    │
    ├── db/                      # Capa de persistencia y esquemas ORM
    │   ├── index.js             # Inicialización de Drizzle con cliente Postgres y esquemas
    │   ├── schema.js            # Definición completa de ~87 esquemas de tablas Drizzle (PG)
    │   ├── relations.js         # Definición de relaciones entre tablas Drizzle
    │   └── migrations/          # Archivos de migración generados por drizzle-kit
    │       ├── 0000_magenta_mole_man.sql
    │       ├── 0001_shiny_epoch.sql
    │       ├── 0002_superb_red_shift.sql
    │       ├── schema.ts
    │       ├── relations.ts
    │       └── meta/            # Diarios de migración y snapshots JSON
    │
    ├── plugins/                 # Plugins modulares de Fastify
    │   ├── auth.js              # Plugin JWT, decorators: authenticate, authenticateApiKey, authorize
    │   ├── cors.js              # Configuración de CORS dinámico por orígenes permitidos
    │   ├── db.js                # Conexión pool a PostgreSQL 18 con verificación al arranque
    │   └── sensible.js          # Integración de @fastify/sensible (HTTP status helpers)
    │
    ├── routes/                  # Definición modular de rutas y controladores HTTP
    │   ├── auth.routes.js            # Endpoints de autenticación, sesión, sucursal activa y menú
    │   ├── cajas.routes.js           # Endpoints CRUD de cajas y series (mediante crud.factory)
    │   ├── clientes.routes.js        # Endpoints CRUD para gestión de clientes
    │   ├── empresas.routes.js        # CRUD de empresas, creación en cascada y módulos asignados
    │   ├── gestion.routes.js         # Enrutador agrupador para catálogos y gestión administrativa
    │   ├── health.routes.js          # Diagnóstico de estado del servidor y PostgreSQL
    │   ├── modulos.routes.js         # Gestión de módulos, árbol jerárquico y permisos CRUD
    │   ├── productos.routes.js       # Endpoints CRUD para gestión de catálogo de productos
    │   ├── roles.routes.js           # Gestión de roles, niveles jerárquicos y asignación de permisos
    │   ├── sucursales.routes.js      # Endpoints CRUD para sucursales multi-empresa
    │   ├── sync.routes.js            # Sincronización server-to-server (push/pull/status)
    │   ├── tiposComprobante.routes.js# Catálogo de tipos de comprobantes SUNAT
    │   ├── usuarios.routes.js        # Gestión de usuarios, jerarquía de roles y accesos multi-tenant
    │   ├── utils.routes.js           # Servicios de consulta a APIs externas (RUC / DNI)
    │   └── ventas.routes.js          # Endpoints para registro y anulación de ventas
    │
    └── services/                # Capa de servicios con reglas de negocio desacopladas
        ├── api_peru_service.js       # Consumo de API externa de RUC/DNI con fallback resiliente
        └── auth_service.js           # Lógica de login, refresh, permisos O(1), conmutación de sede y menú
```

---

## 2. Catálogo Exhaustivo de Endpoints de la API

> **Nota sobre prefijos:**  
> En `src/app.js`, la mayoría de las rutas se montan con `/api/<recurso>`.  
> Las rutas administrativas están agrupadas dentro de `src/routes/gestion.routes.js` montado en `app.js` bajo el prefijo `/api` (lo que resulta en `/api/empresas`, `/api/sucursales`, `/api/almacenes`, `/api/modulos`, `/api/cajas`, `/api/tipos-comprobante`, `/api/roles`, `/api/permisos`).

---

### 2.1 Salud y Diagnóstico (`/api/health`)
*Archivo: `src/routes/health.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Pública | Ninguno | Verifica disponibilidad del servidor Node.js, tiempo activo (`uptime`) y ejecuta `SELECT 1` para validar la conexión con PostgreSQL 18. |

---

### 2.2 Autenticación y Sesión (`/api/auth`)
*Archivo: `src/routes/auth.routes.js`* · *Servicio: `src/services/auth_service.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Pública | Ninguno | Inicia sesión verificando credenciales con `bcrypt`. Resuelve el `active_acceso` (empresa y sucursal predeterminada), calcula permisos O(1) e inyecta el token de acceso JWT y refresh token. **Body:** `{ usuario, password }`. |
| `POST` | `/api/auth/refresh` | Pública | Ninguno | Emite un nuevo `access_token` utilizando un token de actualización vigente almacenado en memoria. **Body:** `{ refresh_token }`. |
| `POST` | `/api/auth/logout` | Bearer JWT | Ninguno | Invalida el `refresh_token` activo en el almacén de sesiones del servidor para el usuario autenticado. |
| `GET` | `/api/auth/me` | Bearer JWT | Ninguno | Retorna los datos de identidad y configuración del usuario conectado (omite el hash de contraseña). |
| `POST` | `/api/auth/switch-branch` | Bearer JWT | Ninguno | Conmuta la empresa/sucursal activa del usuario sin cerrar sesión. Regenera el JWT con el nuevo `active_acceso`, `branch_id`, `empresa_id` y su correspondiente conjunto de permisos. **Body:** `{ branch_id: uuid }`. |
| `GET` | `/api/auth/menu` | Bearer JWT | Ninguno | Genera el árbol jerárquico recursivo de módulos/menús al que el usuario tiene acceso según los módulos activos de su empresa y los permisos asignados a su rol. **Headers opcionales:** `x-empresa-id`. |

---

### 2.3 Usuarios y Accesos Multi-Tenant (`/api/usuarios`)
*Archivo: `src/routes/usuarios.routes.js`*

*Seguridad base: Protegido por el hook `fastify.authorize`. Infiere permisos `usuarios.<accion>` y aplica Row-Level Security (RLS) y filtro de jerarquía de niveles.*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/usuarios` | Bearer JWT | `usuarios.ver` | Lista los usuarios. Si el usuario no es SuperAdmin, aplica RLS aislando solo los usuarios de su empresa cuyo mejor rol tenga un nivel estrictamente inferior (mayor valor numérico) al del usuario solicitante. |
| `GET` | `/api/usuarios/:id` | Bearer JWT | `usuarios.ver` | Obtiene el detalle de un usuario específico por su UUID (excluye el password). |
| `POST` | `/api/usuarios` | Bearer JWT | `usuarios.crear` | Crea un nuevo usuario. Hashea la contraseña con `bcrypt`. Si se envían `empresa_id`, `branch_id` y `rol_id`, crea en una misma transacción su acceso inicial predeterminado. Valida que el rol asignado no tenga un nivel igual o superior al creador. |
| `PUT` | `/api/usuarios/:id` | Bearer JWT | `usuarios.editar` | Actualiza los datos de un usuario. Si se incluye contraseña, la vuelve a hashear; si no, la preserva. Valida que el nombre de usuario sea único. |
| `DELETE` | `/api/usuarios/:id` | Bearer JWT | `usuarios.eliminar` | Elimina o da de baja lógica al usuario según la configuración de la tabla. |
| `GET` | `/api/usuarios/:id/accesos` | Bearer JWT | `usuarios.ver` | Retorna el listado de empresas, sucursales y roles a los que el usuario tiene acceso concedido, con joins a tablas maestras. |
| `POST` | `/api/usuarios/:id/accesos` | Bearer JWT | `usuarios.editar` | Asocia una nueva sucursal y rol al usuario. Valida duplicados por sucursal y respeta la jerarquía de niveles del rol. Si se marca como predeterminado, desmarca los previos. |
| `PUT` | `/api/usuarios/:id/accesos/:accesoId` | Bearer JWT | `usuarios.editar` | Modifica una asignación de acceso (rol o predeterminado). Impide modificar accesos con rol de nivel igual o superior al usuario logueado. |
| `DELETE` | `/api/usuarios/:id/accesos/:accesoId` | Bearer JWT | `usuarios.editar` | Revoca el acceso a una sucursal para el usuario. Valida jerarquía del rol asociado antes de eliminar. |

---

### 2.4 Empresas y Asignación de Módulos (`/api/empresas`)
*Archivo: `src/routes/empresas.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/empresas` | Bearer JWT | `empresas.ver` | Lista empresas del sistema con join a `ubigeo`. Con RLS: si no es SuperAdmin, devuelve exclusivamente la empresa correspondiente al `active_acceso`. |
| `GET` | `/api/empresas/:id` | Bearer JWT | `empresas.ver` | Obtiene los datos detallados de una empresa por ID. |
| `POST` | `/api/empresas` | Bearer JWT | `empresas.crear` | **Creación en Cascada Transaccional:** Inserta la Empresa, crea automáticamente su primera Sucursal ("SEDE PRINCIPAL", anexo 0000) y su Almacén principal ("ALMACÉN PRINCIPAL"). |
| `PUT` | `/api/empresas/:id` | Bearer JWT | `empresas.editar` | Actualiza la información tributaria, comercial y de contacto de la empresa. |
| `DELETE` | `/api/empresas/:id` | Bearer JWT | `empresas.eliminar` | Elimina o desactiva la empresa indicada. |
| `GET` | `/api/empresas/:id/modulos` | Bearer JWT | `empresas.modulos` | Obtiene un array plano con los UUIDs de los módulos actualmente habilitados para la empresa indicada. |
| `POST` | `/api/empresas/:id/modulos` | Bearer JWT | `empresas.modulos` | Reemplaza transaccionalmente los módulos contratados/habilitados para una empresa. **Body:** `{ modulosIds: [uuid, ...] }`. |

---

### 2.5 Sucursales (`/api/sucursales`)
*Archivo: `src/routes/sucursales.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/sucursales` | Bearer JWT | `sucursales.ver` | Lista sucursales con join a `ubigeo`. Aplica RLS filtrando automáticamente por `request.user.empresa_id` para usuarios que no sean SuperAdmin. |
| `GET` | `/api/sucursales/:id` | Bearer JWT | `sucursales.ver` | Obtiene la ficha completa de una sucursal. |
| `POST` | `/api/sucursales` | Bearer JWT | `sucursales.crear` | Registra una nueva sucursal/sede anexa vinculada a una empresa. |
| `PUT` | `/api/sucursales/:id` | Bearer JWT | `sucursales.editar` | Actualiza credenciales SIRE, dirección, anexo o datos comerciales de la sucursal. |
| `DELETE` | `/api/sucursales/:id` | Bearer JWT | `sucursales.eliminar` | Da de baja o elimina la sucursal. |

---

### 2.6 Almacenes (`/api/almacenes`)
*Generado vía: `src/core/crud.factory.js` sobre `schema.almacenes`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/almacenes` | Bearer JWT | `almacenes.ver` | Lista almacenes con soporte de filtros query y RLS por `branch_id`. |
| `GET` | `/api/almacenes/:id` | Bearer JWT | `almacenes.ver` | Obtiene un almacén por su UUID. |
| `POST` | `/api/almacenes` | Bearer JWT | `almacenes.crear` | Crea un almacén inyectando el `branch_id` del token si no es SuperAdmin. |
| `PUT` | `/api/almacenes/:id` | Bearer JWT | `almacenes.editar` | Modifica nombre, dirección o estado del almacén. |
| `DELETE` | `/api/almacenes/:id` | Bearer JWT | `almacenes.eliminar` | Baja lógica o eliminación física del almacén. |

---

### 2.7 Cajas y Series de Facturación (`/api/cajas`)
*Archivo: `src/routes/cajas.routes.js`* · *Generado vía: `crud.factory.js` sobre `schema.caja_serie_correlativo`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/cajas` | Bearer JWT | `cajas.ver` | Lista puntos de venta y correlativos configurados para la sucursal activa. |
| `GET` | `/api/cajas/:id` | Bearer JWT | `cajas.ver` | Obtiene la configuración de una serie/caja específica. |
| `POST` | `/api/cajas` | Bearer JWT | `cajas.crear` | Da de alta una nueva serie para boleta, factura o ticket vinculada a un tipo de comprobante. |
| `PUT` | `/api/cajas/:id` | Bearer JWT | `cajas.editar` | Actualiza correlativo actual, nombre o estado de la caja. |
| `DELETE` | `/api/cajas/:id` | Bearer JWT | `cajas.eliminar` | Desactiva o elimina la serie de facturación. |

---

### 2.8 Tablas Fijas y Catálogos SUNAT (`/api/tipos-*`)
*Archivo: `src/routes/tablasFijas.routes.js`* · *Generado vía: `crud.factory.js` sobre tablas maestras con `publicRead: true`*

Centraliza todos los catálogos estáticos y tablas fijas del sistema y de SUNAT con acceso de lectura libre para cualquier usuario autenticado (`publicRead: true`), eliminando la necesidad de permisos granulares por módulo.

| Endpoint Base | Tabla Schema | Catálogo / Propósito |
| :--- | :--- | :--- |
| `GET /api/tipos-comprobante` | `tipo_comprobante` | Factura (`01`), Boleta (`03`), Nota de Crédito (`07`), etc. |
| `GET /api/tipos-documento` | `tipo_documento` | DNI (`1`), RUC (`6`), Pasaporte (`7`), Carné Extranjería (`4`), etc. |
| `GET /api/tipos-afectacion-igv` | `tipo_afectacion_igv` | Gravado (`10`), Exonerado (`20`), Inafecto (`30`), Exportación (`40`), etc. |
| `GET /api/tipos-unidades-medida` | `tipo_unidades_medida` | Unidades comerciales SUNAT (`NIU`, `KGM`, `LTR`, `ZZ`, etc.). |
| `GET /api/tipos-moneda` | `tipo_moneda` | Monedas internacionales (`PEN`, `USD`, `EUR`). |
| `GET /api/tipos-metodo-pago` | `tipo_metodo_pago` | Medios de pago (`Efectivo`, `Yape`, `Plin`, `Transferencia`, etc.). |
| `GET /api/tipos-pago` | `tipo_pago` | Condiciones de pago comercial (`Contado`, `Crédito`). |
| `GET /api/tipos-operacion` | `tipo_operacion` | Operaciones de venta SUNAT (`Venta Interna`, `Exportación`, etc.). |
| `GET /api/tipos-tributos` | `tipo_tributos` | Tributos e impuestos fiscales (`IGV`, `ISC`, `IVAP`). |
| `GET /api/tipos-existencia` | `tipo_existencia` | Tipos de inventario (`Mercadería`, `Materia Prima`, `Envases`, etc.). |
| `GET /api/tipos-impuesto` | `tipo_impuesto` | Impuestos parametrizados y alícuotas del sistema. |
| `GET /api/tipos-factores` | `tipo_factores` | Factores de cálculo y recargos comerciales. |
| `GET /api/tipos-stock` | `tipo_stock` | Estados de inventario (`Físico`, `Comprometido`). |
| `GET /api/tipos-motivo-traslado` | `tipo_motivo_traslado` | Motivos de guías de remisión (`Venta`, `Compra`, `Traslado sede`). |
| `GET /api/tipos-detraccion` | `tipo_codigos_detraccion` | Bienes y servicios sujetos al SPOT / Detracciones SUNAT. |
| `GET /api/tipos-cambio` | `tipo_cambio` | Histórico y cotización oficial de tipo de cambio. |

---

### 2.9 Módulos del Sistema y Backfill (`/api/modulos`)
*Archivo: `src/routes/modulos.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/modulos` | Bearer JWT | `roles.ver` o SuperAdmin | Lista todos los módulos y menús organizados jerárquicamente (padres primero, luego sus hijos ordenados por `orden`). Utilizado para armar la matriz de permisos en la UI de Roles. |
| `GET` | `/api/modulos/:id` | Bearer JWT | Super Administrador | Obtiene la ficha de un módulo individual. |
| `POST` | `/api/modulos` | Bearer JWT | Super Administrador | Crea un módulo o menú. Si `tipo === 'MENU'`, **genera automáticamente en una transacción los 4 permisos CRUD base:** `<codigo>.ver`, `<codigo>.crear`, `<codigo>.editar`, `<codigo>.eliminar`. |
| `PUT` | `/api/modulos/:id` | Bearer JWT | Super Administrador | Actualiza ruta, icono, orden o datos de un módulo. |
| `DELETE` | `/api/modulos/:id` | Bearer JWT | Super Administrador | Elimina el módulo del sistema. |
| `POST` | `/api/modulos/sync-permisos` | Bearer JWT | Super Administrador | Endpoint de mantenimiento (Backfill) que recorre los menús existentes y asegura que todos tengan creados sus permisos CRUD en la tabla `permisos`. |

---

### 2.10 Roles y Permisos Granulares (`/api/roles`)
*Archivo: `src/routes/roles.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/roles` | Bearer JWT | `roles.ver` | Lista los roles de la empresa actual más los roles del sistema (`empresa_id IS NULL`). Respeta la jerarquía mostrando solo roles con `nivel > user.rol_nivel`. |
| `GET` | `/api/roles/:id` | Bearer JWT | `roles.ver` | Obtiene el detalle de un rol por su ID. |
| `POST` | `/api/roles` | Bearer JWT | `roles.crear` | Crea un rol. Valida que el `nivel` numérico del nuevo rol sea estrictamente superior al nivel del usuario creador (menor poder). |
| `PUT` | `/api/roles/:id` | Bearer JWT | `roles.editar` | Actualiza un rol. Bloquea si el rol objetivo o el nuevo nivel pretendido es igual o superior al del usuario logueado. |
| `DELETE` | `/api/roles/:id` | Bearer JWT | `roles.eliminar` | Elimina un rol si el usuario solicitante supera su nivel jerárquico. |
| `GET` | `/api/roles/:id/permisos` | Bearer JWT | `roles.ver` | Retorna el array de UUIDs de permisos asignados a un rol específico. |
| `POST` | `/api/roles/:id/permisos` | Bearer JWT | `roles.editar` | Reemplaza transaccionalmente los permisos concedidos al rol en `rol_permisos`. Valida jerarquía del rol antes de proceder. **Body:** `{ permisosIds: [uuid, ...] }`. |

---

### 2.11 Permisos del Sistema (`/api/permisos`)
*Generado vía: `crud.factory.js` sobre `schema.permisos` con `permissionOverride: { read: 'roles.ver' }`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/permisos` | Bearer JWT | `roles.ver` *(Override)* | Lista el catálogo global de permisos del sistema para su visualización y asignación en matrices de roles. |
| `GET` | `/api/permisos/:id` | Bearer JWT | `roles.ver` *(Override)* | Obtiene la descripción y código de un permiso específico. |
| `POST` | `/api/permisos` | Bearer JWT | `permisos.crear` | Registra manualmente un nuevo permiso en el catálogo. |
| `PUT` | `/api/permisos/:id` | Bearer JWT | `permisos.editar` | Actualiza nombre o descripción de un permiso. |
| `DELETE` | `/api/permisos/:id` | Bearer JWT | `permisos.eliminar` | Elimina un permiso del catálogo. |

---

### 2.12 Clientes (`/api/clientes`)
*Archivo: `src/routes/clientes.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/clientes` | Bearer JWT | Autenticado | Lista paginada de clientes. Parámetros query: `page`, `limit`, `q`. |
| `GET` | `/api/clientes/:id` | Bearer JWT | Autenticado | Obtiene la información de un cliente por su UUID. |
| `POST` | `/api/clientes` | Bearer JWT | Autenticado | Registra un nuevo cliente con validación de schema de Fastify (`nombre`, `ruc`, `email`, `telefono`, `tipo`). |
| `PUT` | `/api/clientes/:id` | Bearer JWT | Autenticado | Actualiza la información comercial o fiscal de un cliente. |
| `DELETE` | `/api/clientes/:id` | Bearer JWT | Autenticado | Baja lógica del cliente. |

---

### 2.13 Productos (`/api/productos`)
*Archivo: `src/routes/productos.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/productos` | Bearer JWT | Autenticado | Consulta paginada del catálogo de productos con búsqueda por código o nombre (`page`, `limit`, `q`). |
| `GET` | `/api/productos/:id` | Bearer JWT | Autenticado | Consulta la ficha individual de un producto. |
| `POST` | `/api/productos` | Bearer JWT | Autenticado | Crea un nuevo producto validando campos mínimos (`nombre`, `precio`, `codigo`, `stock`, `categoria_id`). |
| `PUT` | `/api/productos/:id` | Bearer JWT | Autenticado | Actualiza precios, nombre o inventario del producto. |
| `DELETE` | `/api/productos/:id` | Bearer JWT | Autenticado | Da de baja lógica al producto. |

---

### 2.14 Ventas (`/api/ventas`)
*Archivo: `src/routes/ventas.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/ventas` | Bearer JWT | Autenticado | Lista comprobantes de venta con filtros por rango de fechas (`desde`, `hasta`), estado y paginación. |
| `GET` | `/api/ventas/:id` | Bearer JWT | Autenticado | Obtiene la cabecera de la venta junto a su detalle de ítems. |
| `POST` | `/api/ventas` | Bearer JWT | Autenticado | Registra una transacción de venta (boleta, factura, ticket) con array de ítems (`producto_id`, `cantidad`, `precio_unitario`, `descuento`). |
| `PATCH` | `/api/ventas/:id/anular` | Bearer JWT | Autenticado | Anula una venta emitida y genera el registro en la cola de sincronización. |

---

### 2.15 Sincronización Servidor-a-Servidor (`/api/sync`)
*Archivo: `src/routes/sync.routes.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/sync/push` | API Key (`x-api-key`) | Servidor Nube/Local | Recibe lotes de modificaciones offline generadas en nodos locales y las aplica mediante Last-Write-Wins. **Body:** `{ registros: [{ tabla, registro_id, operacion, payload, updated_at }] }`. |
| `GET` | `/api/sync/pull` | API Key (`x-api-key`) | Servidor Nube/Local | Permite a los servidores locales consultar y descargar cambios generados en la nube a partir de una fecha/hora dada (`?since=<timestamp>`). |
| `GET` | `/api/sync/status` | Bearer JWT | Autenticado | Informa el estado de sincronización del nodo y la periodicidad programada (`SYNC_INTERVAL_SECONDS`). |

---

### 2.16 Utilidades y Consulta RUC/DNI (`/api/utils`)
*Archivo: `src/routes/utils.routes.js`* · *Servicio: `src/services/api_peru_service.js`*

| Método | Endpoint | Autenticación | Permiso RBAC | Descripción / Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/utils/consulta-documento/:tipo/:numero` | Bearer JWT | Autenticado | Consulta en tiempo real los datos oficiales de un RUC (SUNAT) o DNI (RENIEC). Cuenta con mecanismo de alta disponibilidad que intenta primero la API oficial configurada (`prorucdni.mifacturaperu.com`) y ante caídas salta automáticamente al scraping de contingencia de `apis.net.pe`. |

---

## 3. Ubicación de Controladores, Modelos y Rutas

```
                     ┌────────────────────────────────────────────────────────┐
                     │                       server.js                        │
                     └───────────────────────────┬────────────────────────────┘
                                                 │ inicializa
                                                 ▼
                     ┌────────────────────────────────────────────────────────┐
                     │                     src/app.js                         │
                     └──────┬────────────────────┬────────────────────┬───────┘
                            │                    │                    │
              registra      │      registra      │      registra      │
     ┌──────────────────────▼──────┐   ┌─────────▼──────────┐   ┌─────▼────────────────┐
     │        src/plugins/         │   │    src/routes/     │   │     src/core/        │
     │ ├── auth.js (JWT & RBAC)    │   │ ├── auth.routes.js │   │ ├── crud.factory.js  │
     │ ├── cors.js                 │   │ ├── usuarios.r.js  │   │ ├── generic.service  │
     │ ├── db.js (Postgres pool)   │   │ ├── empresas.r.js  │   │ └── permissions.hook │
     │ └── sensible.js             │   │ └── gestion.r.js ──┼─┐ └──────────────────────┘
     └─────────────────────────────┘   └────────────────────┘ │
                                                              │ sub-enruta
                                       ┌──────────────────────▼───────────────────────┐
                                       │ ├── sucursales.routes.js                     │
                                       │ ├── modulos.routes.js                        │
                                       │ ├── roles.routes.js                          │
                                       │ ├── cajas.routes.js (crud.factory)           │
                                       │ ├── tiposComprobante.routes.js (crud.factory)│
                                       │ └── almacenes / permisos (crud.factory)      │
                                       └──────────────────────────────────────────────┘
                                                              │
                                                consume       │
                                                              ▼
                                       ┌──────────────────────────────────────────────┐
                                       │      src/services/ & src/db/                 │
                                       │ ├── auth_service.js                          │
                                       │ ├── api_peru_service.js                      │
                                       │ ├── db/schema.js (Drizzle ORM)               │
                                       │ └── db/index.js (Drizzle Client)             │
                                       └──────────────────────────────────────────────┘
```

### 3.1 Capa de Rutas (`src/routes/`)
Las rutas están desacopladas en módulos temáticos. Cada archivo exporta una función asíncrona compatible con el sistema de plugins de Fastify:
- **`app.js`**: Registra los routers raíz (`health`, `auth`, `productos`, `clientes`, `ventas`, `usuarios`, `sync`, `gestion`, `utils`).
- **`gestion.routes.js`**: Actúa como un *hub* agregador que anida las rutas de configuración y catálogos (`empresas`, `sucursales`, `almacenes`, `modulos`, `cajas`, `tipos-comprobante`, `roles`, `permisos`).

### 3.2 Capa de Controladores y Lógica de Negocio
El proyecto aplica un patrón híbrido y optimizado para alto rendimiento en Fastify:
1. **Controladores Inline / Route Handlers:** La validación de peticiones y las respuestas HTTP se definen directamente en la declaración de las rutas de cada módulo.
2. **Servicios Especializados (`src/services/`):**
   - **`auth_service.js`**: Maneja el ciclo completo de autenticación: hashing con bcrypt, emisión de tokens, resolución de empresa activa, inyección de permisos en memoria y cálculo recursivo de menús dinámicos (`buildTree`).
   - **`api_peru_service.js`**: Encapsula la comunicación con servicios externos para consultas de padrones SUNAT/RENIEC, con lógica de fallback automático.
3. **Controladores Genéricos Automatizados (`src/core/`):**
   - **`crud.factory.js` (`buildCrudRoutes`)**: Factoría de controladores que genera endpoints estandarizados con soporte automático de inyección de RLS, hooks de autenticación y validación de permisos.
   - **`generic.service.js` (`GenericService`)**: Abstracción de operaciones CRUD (`getAll`, `getById`, `create`, `update`, `remove`) sobre cualquier tabla definida en Drizzle.
4. **Carpeta `src/controllers/`**:
   - Se mantiene creada en la estructura como punto de extensión preparado para futuros controladores desacoplados cuando la complejidad de ciertas rutas lo requiera.

### 3.3 Capa de Modelos y Base de Datos (`src/db/`)
- **`src/db/index.js`**: Conexión a la base de datos a través de `drizzle-orm/postgres-js` configurada con un pool de conexiones y el esquema combinado.
- **`src/db/schema.js`**: Esqueleto central de la base de datos en PostgreSQL con más de **80 tablas** fuertemente tipadas y estructuradas en los siguientes dominios:
  - **Multi-Tenant y Sedes:** `empresas`, `sucursales`, `almacenes`, `ubigeo`.
  - **Identidad, Jerarquía y RBAC:** `usuarios`, `usuario_accesos`, `roles`, `modulos`, `permisos`, `rol_permisos`, `usuario_permisos`, `empresa_modulos`, `tokens_autorizacion`.
  - **Catálogos SUNAT y Facturación:** `tipo_comprobante`, `tipo_documento`, `tipo_afectacion_igv`, `tipo_tributos`, `tipo_moneda`, `tipo_pago`, `tipo_metodo_pago`, `tipo_cambio`, `tipo_codigos_detraccion`, `tipo_motivo_traslado`, `tipo_existencia`, `tipo_unidades_medida`, `tipo_factores`.
  - **Gestión de Caja y Arqueos:** `caja_serie_correlativo`, `caja_turnos`, `caja_movimientos`, `caja_totales`, `caja_arqueos`, `caja_chica`, `caja_chica_sesiones`, `caja_chica_movimientos`, `caja_chica_arqueos`, `caja_chica_totales`.
  - **Inventario y Productos:** `productos`, `presentaciones`, `stock`, `stock_actual`, `lotes`, `categorias`, `subcategoria`, `movimiento_almacen`, `movimiento_almacen_detalle`, `recetas`, `recetas_detalles`.
  - **Ventas y Comprobantes Electrónicos:** `ventas`, `detalle_ventas`, `ventas_pagos`, `ventas_sire`, `pre_ventas`, `cotizaciones`, `notas_credito`, `guias_remision`, `mensajeticket`.
  - **Compras y Proveedores:** `compra`, `compra_detalle`, `compra_orden`, `compra_cotizacion`, `compra_requerimiento`, `compras_pagos`, `compras_sire`, `proveedores`, `productos_proveedores`.
- **`src/db/relations.js`**: Relaciones explícitas de Drizzle (ej. `caja_serie_correlativo` con `tipo_comprobante`).
- **`src/db/migrations/`**: Migraciones SQL DDL generadas por Drizzle Kit (`0000`, `0001`, `0002`).

### 3.4 Capa de Plugins Fastify (`src/plugins/`)
- **`auth.js`**: Registra `@fastify/jwt` y decora la instancia con tres hooks esenciales:
  1. `fastify.authenticate`: Valida la existencia y firma del Bearer JWT.
  2. `fastify.authenticateApiKey`: Valida el header `x-api-key` para replicación entre servidores.
  3. `fastify.authorize`: Middleware inteligente de autorización. Decodifica el token, inyecta `empresa_id`, `branch_id` y `rol_nivel`, permite paso libre al `es_super_admin` e infiere en tiempo constante $O(1)$ si el usuario posee el permiso de la ruta.
- **`db.js`**: Abre el cliente de conexión nativa de `postgres` y provee health check.
- **`cors.js`**: Gestiona las políticas CORS a través de orígenes configurados por variable de entorno.
- **`sensible.js`**: Habilita métodos semánticos para respuestas de error estándar de HTTP (`reply.notFound()`, etc.).

---

## 4. Variables de Entorno Requeridas

Las siguientes variables son leídas por el backend a través de `dotenv` y `@fastify/env`. Están documentadas en `BACK/.env.example` y activas en `BACK/.env`:

| Variable | Tipo | Requerida | Valor por Defecto / Ejemplo | Propósito y Descripción |
| :--- | :---: | :---: | :--- | :--- |
| `PORT` | Numérico | No | `5000` | Puerto TCP en el que el servidor Fastify escucha peticiones. |
| `NODE_ENV` | String | Sí | `production` / `development` | Entorno de ejecución de Node. En `development` activa formateo visual de logs con `pino-pretty`. |
| `LOG_LEVEL` | String | No | `info` | Nivel mínimo de detalle para Pino Logger (`debug`, `info`, `warn`, `error`). |
| `DATABASE_URL` | String | **Sí** | `postgresql://user:pass@host:5432/db` | Cadena de conexión para PostgreSQL 18. Consumida por Drizzle ORM y el cliente `postgres`. |
| `JWT_SECRET` | String | **Sí** | *Cadena criptográfica extensa* | Clave secreta simétrica utilizada para firmar y verificar tokens de acceso JWT. |
| `JWT_EXPIRES_IN` | String | No | `15m` (o `8h` en dev) | Tiempo de expiración del token de acceso (`access_token`). |
| `REFRESH_TOKEN_EXPIRES_IN` | String | No | `7d` | Tiempo de vida útil del token de actualización (`refresh_token`). |
| `CORS_ORIGINS` | String | **Sí** | `http://localhost:5175,http://127.0.0.1:5175` | Lista separada por comas de los orígenes frontend autorizados para interactuar con la API. |
| `SYNC_API_KEY` | String | **Sí** | *Clave secreta compartida* | Clave para autenticación en cabecera `x-api-key` requerida por las rutas `/api/sync/push` y `/pull`. |
| `SYNC_INTERVAL_SECONDS` | Numérico | No | `30` | Intervalo de referencia en segundos para el ciclo de sincronización de datos. |
| `API_PERU_URL` | String | No | `https://prorucdni.mifacturaperu.com` | URL base del microservicio primario para consulta de padrones de RUC y DNI. |
| `API_PERU_TOKEN` | String | No | *Token de autenticación API* | Token Bearer de autorización para consultar la API de RUC/DNI. |
| `TZ` | String | No | `America/Lima` | Zona horaria del sistema para el formateo de marcas de tiempo en PostgreSQL y Node.js. |

---

## 5. Mecanismos Clave de Seguridad y Arquitectura

### 5.1 Aislamiento Multi-Tenant (Row-Level Security - RLS)
- Ningún usuario común puede ver ni modificar registros ajenos a su empresa asignada.
- Al autenticarse, el backend inyecta `request.user.empresa_id` y `request.user.branch_id` a partir del `active_acceso`.
- Las consultas en `crud.factory.js`, `GenericService` y los endpoints de `empresas`, `sucursales` y `usuarios` filtran automáticamente por estos campos a menos que el usuario posea la bandera `es_super_admin = true`.

### 5.2 Jerarquía de Niveles de Roles
- Los roles poseen una columna numérica `nivel` con **regla de inversión**: a menor número, mayor jerarquía (`1` = SuperAdmin / Propietario, `50` = Administrador, `100` = Vendedor).
- Ningún usuario puede ver, crear, editar o eliminar roles o accesos que tengan un nivel igual o superior al suyo propio.

### 5.3 Validación de Permisos en Tiempo Constante $O(1)$
- Al iniciar sesión o cambiar de sucursal (`switch-branch`), el conjunto de códigos de permiso autorizados se calcula y se incluye dentro del payload del JWT.
- En cada petición, el decorador `fastify.authorize` verifica la existencia del permiso (`modulo.accion`) directamente en memoria en $O(1)$, evitando consultas lentas a la base de datos en peticiones transaccionales.

### 5.4 Integridad Transaccional
- Toda operación que involucre más de una tabla dependiente (por ejemplo, registrar una empresa junto con su sucursal y almacén principal, o registrar un usuario con su acceso y rol inicial) se ejecuta dentro de un bloque `await db.transaction(async (tx) => ...)`. Si cualquier paso falla, se realiza un rollback automático.

---

> 📌 *Este índice fue generado automáticamente a partir de un análisis estático exhaustivo del código fuente del backend. Para detalles adicionales sobre las políticas de seguridad en frontend y backend, consulte también [DOCUMENTACION_SEGURIDAD.md](file:///home/soporte/Documentos/MIFACTURAPERU/pERP-2027/DOCUMENTACION_SEGURIDAD.md).*
