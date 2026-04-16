# COQUI BOT — System Architecture

## Overview

```
                        ┌─────────────────────────────────────┐
                        │          OKE Cluster                │
                        │       (namespace: mtdrworkshop)     │
                        │                                     │
  Browser ──────────────►  LoadBalancer Service :80           │
                        │         │                           │
  Telegram ─────────────►  Spring Boot Pod(s) :8080           │
   (long-poll)          │    ┌────┴────────────────┐          │
                        │    │  React SPA (static) │          │
                        │    │  REST API /todolist  │          │
                        │    │  REST API /users     │          │
                        │    │  Telegram Bot (poll) │          │
                        │    │  DeepSeek client     │          │
                        │    └────────────┬─────────┘          │
                        │                │ JDBC/UCP            │
                        └────────────────┼────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  Oracle ATP (ATP-S)  │
                              │   DB: TASKBOTDB      │
                              │   User: ADMIN        │
                              │  Region: mx-queretaro│
                              └─────────────────────┘
```

---

## Component Breakdown

### 1. Spring Boot Backend (`backend/`)

**Entry point:** `MyTodoListApplication.java`

| Package | Responsibility |
|---|---|
| `config` | DataSource (Oracle UCP), CORS, Telegram bot token, DeepSeek HTTP client |
| `controller` | REST: `ToDoItemController`, `UserController`; Bot: `ToDoItemBotController` |
| `model` | JPA entities + DTO: `Tarea`, `Usuario`, `Proyecto`, `User`, `ToDoItem` (DTO) |
| `repository` | JPA repos: `TareaRepository`, `UsuarioRepository`, `ProyectoRepository`, `UserRepository` |
| `service` | `ToDoItemService` (Tarea↔ToDoItem translation), `UserService`, `DeepSeekService` |
| `util` | `BotActions` (command handlers), `BotLabels`, `BotMessages`, `BotCommands`, `BotHelper`, `BotClient` |

**Key design decision:** `ToDoItem` is a **DTO only** (not a JPA entity). All persistence goes through `Tarea`. `ToDoItemService` translates between the two to preserve backward compatibility with the controller and bot layers.

### 2. React Frontend (`src/main/frontend/`)

Served as static files embedded in the Spring Boot JAR (built with `npm run build`, output copied to `src/main/resources/static`).

| Component | Role |
|---|---|
| `App.js` | Root component — state management, API calls |
| `API.js` | Base URL: `/todolist` (same-origin, no CORS needed) |
| `Topbar` | App header |
| `SummaryCards` | Metrics: total, active, completed, overdue |
| `TaskComposer` | New task form |
| `TaskFilters` | Search, project, status, priority filters |
| `TaskTable` | Task list with toggle-done and delete |
| `TaskDetailDrawer` | Side panel with task history and AI suggestions |
| `BotActivityPanel` | Frontend-only activity log |

### 3. Telegram Bot

- Runs inside the same Spring Boot process as a long-polling consumer (`ToDoItemBotController`)
- Uses `telegrambots-springboot-longpolling-starter`
- Bot username: `Oracle_420_bot`
- All bot commands dispatch to handler methods in `BotActions`
- Extended pipe-format for rich task creation: `Title | Description | Priority | Date | Hours`

### 4. Oracle ATP Database

- **Region:** `mx-queretaro-1`
- **DB Name:** `TASKBOTDB`
- **User:** `ADMIN`
- **Connection:** Oracle Wallet (mounted as Kubernetes secret at `/mtdrworkshop/creds`)
- **Connection string:** `@TASKBOTDB_tp` (transaction processing service) in K8s; `@taskbotdb_medium` in application.properties

---

## Database Schema

### Table: `TAREA` (primary task table)

| Column | Type | Notes |
|--------|------|-------|
| `ID_TAREA` | NUMBER (PK, identity) | Maps to `ToDoItem.ID` |
| `ID_USUARIO_ASIGNADO` | NUMBER (FK → USUARIO) | Default: `coqui_bot_user` |
| `ID_PROYECTO` | NUMBER (FK → PROYECTO) | Default: `COQUI BOT` project |
| `TITULO` | VARCHAR2 | Maps to `ToDoItem.description` |
| `DESCRIPCION` | VARCHAR2 | Maps to `ToDoItem.descripcion` |
| `PRIORIDAD` | VARCHAR2 | `alta` / `media` / `baja` |
| `ESTADO` | VARCHAR2 | `pendiente` / `completada` / `cerrada` |
| `FECHA_CREACION` | TIMESTAMP WITH TZ | Maps to `ToDoItem.creation_ts` / `createdAt` |
| `FECHA_LIMITE` | TIMESTAMP WITH TZ | Maps to `ToDoItem.fechaLimite` |
| `FECHA_CIERRE` | TIMESTAMP WITH TZ | Set automatically when `done=true` |
| `HORAS_ESTIMADAS` | NUMBER | Maps to `ToDoItem.horasEstimadas` |
| `HORAS_REALES` | NUMBER | Maps to `ToDoItem.horasReales` |

### Table: `USUARIO`

| Column | Type | Notes |
|--------|------|-------|
| `ID_USUARIO` | NUMBER (PK, identity) | |
| `TELEGRAM_ID` | VARCHAR2 | Telegram user ID |
| `NOMBRE` | VARCHAR2 | Display name |
| `USERNAME` | VARCHAR2 | Unique username |
| `ROL` | VARCHAR2 | `admin` / `user` |
| `FECHA_REGISTRO` | TIMESTAMP WITH TZ | |
| `ESTADO` | VARCHAR2 | `activo` / `inactivo` |

### Table: `PROYECTO`

| Column | Type | Notes |
|--------|------|-------|
| `ID_PROYECTO` | NUMBER (PK, identity) | |
| `NOMBRE` | VARCHAR2 | Unique project name |
| `DESCRIPCION` | VARCHAR2 | |
| `FECHA_CREACION` | TIMESTAMP WITH TZ | |
| `ESTADO` | VARCHAR2 | `activo` / `inactivo` |

### Table: `USERS` (legacy)

| Column | Type | Notes |
|--------|------|-------|
| `ID` | NUMBER (PK, identity) | |
| `PHONENUMBER` | VARCHAR2 | |
| `PASSWORD` | VARCHAR2 | |

> **Note:** `USERS` is a legacy table used only by `UserController`/`UserService`/`User.java`. It is separate from `USUARIO` which is the active user table linked to `TAREA`.

### Column Mapping: ToDoItem DTO ↔ TAREA

| ToDoItem field | DB column | JSON key |
|---|---|---|
| `ID` | `ID_TAREA` | `id` |
| `description` | `TITULO` | `description` |
| `descripcion` | `DESCRIPCION` | `descripcion` |
| `prioridad` | `PRIORIDAD` | `prioridad` |
| `estado` | `ESTADO` | `estado` |
| `done` | derived from `ESTADO` | `done` |
| `creation_ts` | `FECHA_CREACION` | `createdAt` |
| `fechaLimite` | `FECHA_LIMITE` | `fechaLimite` |
| `horasEstimadas` | `HORAS_ESTIMADAS` | `horasEstimadas` |
| `horasReales` | `HORAS_REALES` | `horasReales` |

---

## Kubernetes Deployment Structure

**Namespace:** `mtdrworkshop`

```
mtdrworkshop namespace
├── Deployment: todolistapp-springboot-deployment
│   ├── replicas: 2
│   ├── image: mx-queretaro-1.ocir.io/axmwzvmpn3zm/agileimage:0.1
│   ├── containerPort: 8080
│   ├── envFrom: db_url, db_user, dbpassword, driver_class_name, OCI_REGION
│   ├── volumeMount: /mtdrworkshop/creds  ← Oracle wallet
│   └── topologySpreadConstraints: spread across nodes (maxSkew:1)
│
├── Service: todolistapp-springboot-service
│   ├── type: LoadBalancer  (OCI LB, policy: IP_HASH)
│   └── port: 80 → 8080
│
├── Service: todolistapp-backend-router
│   └── port: 80 → http (ClusterIP, internal routing)
│
├── Secret: dbuser
│   └── dbpassword: <db-password>
│
├── Secret: db-wallet-secret
│   └── <oracle-wallet-files>
│
├── Secret: frontendadmin
│   └── password: <ui-password>
│
└── Secret: ocisecret
    └── docker registry pull secret for OCIR
```

---

## Request Flow

### REST API (Frontend)

```
Browser → OCI LB :80 → Service → Pod :8080
  → ToDoItemController
  → ToDoItemService          (Tarea ↔ ToDoItem translation)
  → TareaRepository
  → Oracle ATP (TAREA table)
```

### Telegram Bot

```
Telegram servers → Bot long-polls → ToDoItemBotController.consume()
  → BotActions (fnStart / fnListAll / fnElse / etc.)
  → ToDoItemService
  → TareaRepository
  → Oracle ATP
  → BotHelper.sendMessageToTelegram()
  → Telegram servers → user
```

### Data Source Configuration (runtime)

The `OracleConfiguration` @Bean reads from **environment variables** (for Kubernetes):
- `db_url` → JDBC URL
- `db_user` → username
- `dbpassword` → password
- `driver_class_name` → driver class

In local development, values fall back to `application.properties` (`spring.datasource.*`) **only if** env vars are not overriding them. See LOGS.md for the known conflict.
