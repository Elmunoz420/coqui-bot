# CLAUDE.md — Context for AI Sessions

This file documents the current state of the COQUI BOT project for AI-assisted development sessions.

---

## Project Identity

- **App name:** COQUI BOT
- **Purpose:** Telegram-based task manager with React dashboard
- **Telegram bot username:** `Oracle_420_bot`
- **OCI region:** `mx-queretaro-1`
- **Image registry:** `mx-queretaro-1.ocir.io/axmwzvmpn3zm`
- **Image name:** `agileimage:0.1` (used in deploy-final.yaml)
- **Kubernetes namespace:** `mtdrworkshop`
- **DB user:** `ADMIN`
- **DB name:** `TASKBOTDB`

---

## Critical Architecture Notes

### The ToDoItem ↔ Tarea Translation Layer

`ToDoItem` is **NOT** a JPA entity. It is a DTO kept for backward compatibility.
The real JPA entity is `Tarea` (maps to table `TAREA`).

`ToDoItemService` translates between them:
- `tareaToToDoItem(Tarea)` — converts for API responses
- `applyToDoItemToTarea(ToDoItem, Tarea)` — applies updates to the real entity

**Do not add JPA annotations to `ToDoItem`.** Do not try to query `TODOITEM` table — it no longer exists (or is not used).

### Column Mappings

| ToDoItem field | TAREA column | Notes |
|---|---|---|
| `ID` | `ID_TAREA` | PK |
| `description` | `TITULO` | The title shown in bot and frontend |
| `descripcion` | `DESCRIPCION` | Long description |
| `prioridad` | `PRIORIDAD` | `alta` / `media` / `baja` |
| `estado` | `ESTADO` | `pendiente` / `completada` / `cerrada` |
| `done` | derived | `true` if ESTADO is completada/done/cerrada |
| `creation_ts` | `FECHA_CREACION` | JSON key: `createdAt` |
| `fechaLimite` | `FECHA_LIMITE` | JSON key: `fechaLimite` |
| `horasEstimadas` | `HORAS_ESTIMADAS` | |
| `horasReales` | `HORAS_REALES` | |

### FK Requirements

`TAREA` has two required foreign keys:
- `ID_USUARIO_ASIGNADO` → `USUARIO.ID_USUARIO`
- `ID_PROYECTO` → `PROYECTO.ID_PROYECTO`

`ToDoItemService.initDefaults()` (@PostConstruct) creates default records:
- Usuario: username=`coqui_bot_user`, rol=`admin`
- Proyecto: nombre=`COQUI BOT`

Every new task is assigned to these defaults unless specified otherwise.

---

## Known Issues (as of 2026-04-14)

### ISSUE-001: Dual DataSource Configuration Conflict
**File:** `backend/src/main/java/com/springboot/MyTodoList/config/OracleConfiguration.java`
**Description:** `OracleConfiguration` creates a `@Bean DataSource` that reads from env vars (`db_url`, `db_user`, `dbpassword`, `driver_class_name`). These override `spring.datasource.*` from `application.properties`. In local development where env vars are not set, all values will be `null`, causing a connection failure at startup.
**Workaround:** For local dev, either:
1. Set the 4 env vars in your shell before running, OR
2. Comment out `OracleConfiguration.java` and let Spring Boot use `application.properties` directly.
**Status:** Open

### ISSUE-002: Hardcoded Credentials — RESOLVED
**File:** `backend/src/main/resources/application.properties`
**Description:** Real DB password and Telegram bot token were previously stored in plain text. Secrets are now only in `application-local.properties` (gitignored) for local dev, and in Kubernetes secrets for production.
**Status:** Resolved — credentials moved to `application-local.properties` (gitignored) and K8s secrets

### ISSUE-003: deploy-final.yaml Legacy Env Var — RESOLVED
**File:** `backend/deploy-final.yaml`
**Description:** Stale `todo.table.name` env var that referenced the old TODOITEM table has been removed.
**Status:** Resolved

### ISSUE-004: BotActions.fnHide() Operator Precedence Bug
**File:** `backend/src/main/java/com/springboot/MyTodoList/util/BotActions.java` (lines 139-140)
**Description:**
```java
if (requestText.equals(BotCommands.HIDE_COMMAND.getCommand())
    || requestText.equals(BotLabels.HIDE_MAIN_SCREEN.getLabel()) && !exit)
```
Due to `&&` binding tighter than `||`, this evaluates as:
```
HIDE_COMMAND || (HIDE_MAIN_SCREEN && !exit)
```
The `HIDE_COMMAND` case ignores the `exit` flag, which may cause the bot to respond even if a prior action already handled the message.
**Fix:** Add parentheses:
```java
if ((requestText.equals(BotCommands.HIDE_COMMAND.getCommand())
    || requestText.equals(BotLabels.HIDE_MAIN_SCREEN.getLabel())) && !exit)
```
**Status:** Open — logic bug

### ISSUE-005: BotActions.fnLLM() Hardcoded Prompt
**File:** `backend/src/main/java/com/springboot/MyTodoList/util/BotActions.java` (line 327)
**Description:**
```java
String prompt = "Dame los datos del clima en mty";
```
The LLM command always sends the same hardcoded prompt regardless of what the user types. The user input is ignored.
**Fix:** Replace with `requestText.replace(BotCommands.LLM_REQ.getCommand(), "").trim()` to pass the user's actual prompt.
**Status:** Open — feature incomplete

### ISSUE-006: DeepSeek API Key is a Placeholder
**File:** `backend/src/main/resources/application.properties`
**Description:** `deepseek.api.key=sk-test` — this is not a real key. DeepSeek calls will fail.
**Status:** Open — feature non-functional until a valid key is provided

### ISSUE-007: MyTodoListBot.java,prop — Malformed Filename
**File:** `backend/src/main/java/com/springboot/MyTodoList/util/MyTodoListBot.java,prop`
**Description:** A file exists with a comma in its name. This is likely a corrupted or misnamed file from an IDE export. It is not compiled by Maven (javac ignores it), but it should be investigated or deleted.
**Status:** Open — needs investigation

### ISSUE-008: Frontend `reloadOneIteam` Typo
**File:** `backend/src/main/frontend/src/App.js` (line 236)
**Description:** Function named `reloadOneIteam` (typo for `reloadOneItem`).
**Status:** Open — cosmetic, no functional impact

### ISSUE-009: Legacy `User`/`USERS` Table vs `Usuario`/`USUARIO`
**Description:** Two separate user models exist:
- `User.java` → `USERS` table (legacy, only has `ID`, `PHONENUMBER`, `PASSWORD`)
- `Usuario.java` → `USUARIO` table (active, has Telegram ID, name, role, status)

`UserController` and `UserService` still operate on the legacy `USERS` table. They are not connected to the bot or task assignment logic.
**Status:** Open — tech debt, legacy code unused by main flows

---

## Deploy Commands

### Build and push image
```bash
export DOCKER_REGISTRY=mx-queretaro-1.ocir.io/axmwzvmpn3zm
cd backend
./build.sh
# Runs: mvn clean package, docker build -t $DOCKER_REGISTRY/todolistapp-springboot:0.1 .
# Then: docker push $IMAGE
```

### Manual image build (Windows PowerShell)
```powershell
# See backend/buildImgContainer.ps1
```

### Deploy to OKE
```bash
kubectl apply -f backend/deploy-final.yaml -n mtdrworkshop
```

### Check pods
```bash
kubectl get pods -n mtdrworkshop
kubectl logs -f deployment/todolistapp-springboot-deployment -n mtdrworkshop
```

### Undeploy
```bash
cd backend && ./undeploy.sh
# or:
kubectl delete -f backend/deploy-final.yaml -n mtdrworkshop
```

### Update image in running deployment
```bash
kubectl set image deployment/todolistapp-springboot-deployment \
  todolistapp-springboot=mx-queretaro-1.ocir.io/axmwzvmpn3zm/agileimage:0.1 \
  -n mtdrworkshop
kubectl rollout restart deployment/todolistapp-springboot-deployment -n mtdrworkshop
```

---

## application.properties Config (local override)

For local testing without env vars, comment out `OracleConfiguration.java` Bean and use:
```properties
spring.datasource.url=jdbc:oracle:thin:@taskbotdb_medium?TNS_ADMIN=./wallet
spring.datasource.username=ADMIN
spring.datasource.password=<password>
spring.datasource.driver-class-name=oracle.jdbc.OracleDriver
```

---

## Frontend API

All API calls use relative URL `/todolist` (same-origin). No CORS configuration needed in production. During development with `npm start` (port 3000), add a proxy in `package.json`:
```json
"proxy": "http://localhost:8080"
```

---

## Telegram Bot Format

Simple task:
```
Buy groceries
```

Rich task (pipe-separated):
```
Fix login bug | Auth fails on wrong password | ALTA | 2025-05-01 | 3
```
Fields: `Title | Description | Priority | Due date (YYYY-MM-DD) | Estimated hours`
