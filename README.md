# COQUI BOT — Telegram Task Manager

A full-stack task management application with a **Telegram bot interface**, **React 18 frontend**, and **Spring Boot 3 REST API**, backed by **Oracle Autonomous Database (ATP)** and deployed on **Oracle Kubernetes Engine (OKE)**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3 (Java 17+, tested with JDK 21) |
| Frontend | React 18 + Material UI |
| Database | Oracle ATP (Autonomous Transaction Processing) |
| Bot | Telegram Bot API (long-polling) |
| Container | Docker (`openjdk:22-jdk`) |
| Orchestration | Kubernetes (OKE) — namespace `mtdrworkshop` |
| Registry | OCI Container Registry (OCIR) — `mx-queretaro-1` |
| AI (optional) | DeepSeek API |

---

## Architecture Overview

```
                      ┌─────────────────────────────────────┐
                      │          OKE Cluster                │
                      │       (namespace: mtdrworkshop)     │
                      │                                     │
  Browser ────────────►  LoadBalancer Service :80           │
                      │         │                           │
  Telegram ───────────►  Spring Boot Pod(s) :8080           │
   (long-poll)        │    ┌────┴────────────────┐          │
                      │    │  React SPA (static) │          │
                      │    │  REST API /todolist  │          │
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

**Key components:**
- **Frontend** — React SPA served as static files embedded in the Spring Boot JAR
- **Backend** — Spring Boot 3 REST API + Telegram long-polling bot in the same process
- **Database** — Oracle ATP with tables `TAREA`, `USUARIO`, `PROYECTO`, `USERS`
- **Bot** — `Oracle_420_bot` on Telegram; commands dispatched through `BotActions`
- **K8s** — 2-replica Deployment, OCI LoadBalancer, wallet + secrets mounted as Kubernetes Secrets

For a full component breakdown, database schema, and request flow diagrams see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Project Structure

```
MtdrSpring/
├── backend/
│   ├── src/main/
│   │   ├── java/com/springboot/MyTodoList/
│   │   │   ├── config/       # DataSource, CORS, Bot props, DeepSeek HTTP client
│   │   │   ├── controller/   # REST controllers + Telegram bot consumer
│   │   │   ├── model/        # JPA entities (Tarea, Usuario, Proyecto) + ToDoItem DTO
│   │   │   ├── repository/   # Spring Data JPA repositories
│   │   │   ├── service/      # Business logic + Tarea↔ToDoItem translation
│   │   │   └── util/         # Bot action handlers, labels, messages, commands
│   │   ├── frontend/         # React 18 app (built output served by Spring Boot)
│   │   └── resources/
│   │       ├── application.properties                    # Committed; no secrets
│   │       ├── application-local.properties              # Gitignored; your real credentials
│   │       └── application-local.properties.template    # Copy this to set up local dev
│   ├── wallet/               # Oracle ATP wallet files (gitignored)
│   ├── Dockerfile
│   ├── deploy-final.yaml     # Kubernetes Service + Deployment manifests
│   ├── build.sh              # Build JAR + Docker image + push to OCIR
│   └── deploy.sh             # kubectl apply via template yaml
├── terraform/                # OCI infrastructure provisioning
├── ARCHITECTURE.md
└── README.md
```

---

## Prerequisites

- **Java 17+** (tested with JDK 21 Temurin; `pom.xml` targets Java 17)
- **Maven 3.8+** (or use the included `./mvnw` wrapper)
- **Node.js 18+** and npm (for frontend development)
- **Oracle ATP wallet** — download from OCI Console → Autonomous Database → DB Connection → Download Wallet

---

## Local Development Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd oci_devops_project/MtdrSpring
```

### 2. Place the Oracle Wallet

Download your wallet from the OCI Console and extract it into:

```
backend/wallet/
```

The wallet directory is gitignored and will never be committed.

### 3. Configure local credentials

```bash
cp backend/src/main/resources/application-local.properties.template \
   backend/src/main/resources/application-local.properties
```

Edit `application-local.properties` and fill in your real values:

```properties
spring.datasource.url=jdbc:oracle:thin:@taskbotdb_medium?TNS_ADMIN=./wallet
spring.datasource.username=ADMIN
spring.datasource.password=YOUR_ATP_PASSWORD

telegram.bot.token=YOUR_TELEGRAM_BOT_TOKEN
telegram.bot.name=Oracle_420_bot

deepseek.api.key=sk-disabled   # or a real key if you want AI features

server.port=9090
```

> `application-local.properties` is gitignored. Never commit real credentials.

### 4. Handle OracleConfiguration (important for local dev)

`OracleConfiguration.java` reads DB credentials from environment variables (`db_url`, `db_user`, `dbpassword`) intended for Kubernetes. In local development these env vars are typically not set, which causes a startup failure.

**Option A — Set env vars before running:**
```bash
export db_url="jdbc:oracle:thin:@taskbotdb_medium?TNS_ADMIN=./wallet"
export db_user="ADMIN"
export dbpassword="YOUR_ATP_PASSWORD"
export driver_class_name="oracle.jdbc.OracleDriver"
```

**Option B — Comment out the `@Bean` in `OracleConfiguration.java`** and let Spring Boot auto-configure from `application-local.properties`.

### 5. Build the React frontend

```bash
cd backend/src/main/frontend
npm install
npm run build
cd ../../../../
```

The build output is automatically copied to `src/main/resources/static` and served by Spring Boot.

### 6. Build the Spring Boot JAR

```bash
cd backend
./mvnw clean package -DskipTests
```

### 7. Run the application

**Quickest option — Maven wrapper (recommended for local dev):**

Run from the `backend/` directory so `TNS_ADMIN=./wallet` resolves correctly:

```bash
cd backend
.\mvnw spring-boot:run "-Dspring-boot.run.profiles=local"
```

**Alternative — run the JAR directly:**

```bash
java \
  "-Doracle.net.tns_admin=./wallet" \
  "-Dspring.profiles.active=local" \
  -jar target/MyTodoList-0.0.1-SNAPSHOT.jar
```

The app starts at **http://159.54.154.150/** (port set in `application-local.properties`).

Swagger UI is available at: **http://localhost:9090/swagger-ui/index.html**

---

## OKE Deployment

### Prerequisites
- `kubectl` configured for your OKE cluster
- Docker logged in to OCIR (`docker login mx-queretaro-1.ocir.io`)
- Kubernetes secrets created (see below)

### 1. Create Kubernetes secrets

```bash
# DB password
kubectl create secret generic dbuser \
  --from-literal=dbpassword='YOUR_ATP_PASSWORD' \
  -n mtdrworkshop

# Oracle wallet
kubectl create secret generic db-wallet-secret \
  --from-file=path/to/wallet/dir \
  -n mtdrworkshop

# Telegram bot token
kubectl create secret generic telegram-bot-secret \
  --from-literal=token='YOUR_TELEGRAM_BOT_TOKEN' \
  -n mtdrworkshop

# Frontend basic-auth password
kubectl create secret generic frontendadmin \
  --from-literal=password='YOUR_UI_PASSWORD' \
  -n mtdrworkshop

# OCIR pull secret
kubectl create secret docker-registry ocisecret \
  --docker-server=mx-queretaro-1.ocir.io \
  --docker-username='axmwzvmpn3zm/YOUR_OCI_USERNAME' \
  --docker-password='YOUR_AUTH_TOKEN' \
  -n mtdrworkshop
```

### 2. Build and push the Docker image

```bash
export DOCKER_REGISTRY=mx-queretaro-1.ocir.io/axmwzvmpn3zm
cd backend
./build.sh
```

This runs `mvn clean package`, builds the Docker image tagged as `agileimage:0.1`, and pushes it to OCIR.

### 3. Apply Kubernetes manifests

```bash
kubectl apply -f backend/deploy-final.yaml -n mtdrworkshop
```

### 4. Verify deployment

```bash
kubectl get pods -n mtdrworkshop
kubectl get svc -n mtdrworkshop
kubectl logs -f deployment/todolistapp-springboot-deployment -n mtdrworkshop
```

### 5. Update a running deployment after a new image push

```bash
kubectl set image deployment/todolistapp-springboot-deployment \
  todolistapp-springboot=mx-queretaro-1.ocir.io/axmwzvmpn3zm/agileimage:0.1 \
  -n mtdrworkshop
kubectl rollout restart deployment/todolistapp-springboot-deployment -n mtdrworkshop
```

---

## API Endpoints

Swagger UI: `/swagger-ui/index.html`

### Tasks — `/todolist`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/todolist` | List all tasks |
| GET | `/todolist/{id}` | Get task by ID |
| POST | `/todolist` | Create new task |
| PUT | `/todolist/{id}` | Update task |
| DELETE | `/todolist/{id}` | Delete task |

**Request body (POST / PUT):**
```json
{
  "description": "Task title",
  "descripcion": "Detailed description",
  "prioridad": "alta|media|baja",
  "done": false,
  "fechaLimite": "2025-12-31T18:00:00Z",
  "horasEstimadas": 4.0,
  "horasReales": 0.0
}
```

**Response fields:**
```json
{
  "id": 1,
  "description": "Task title",
  "descripcion": "Detailed description",
  "prioridad": "media",
  "estado": "pendiente|completada|cerrada",
  "done": false,
  "createdAt": "2025-04-10T12:00:00Z",
  "fechaLimite": null,
  "horasEstimadas": 0.0,
  "horasReales": 0.0,
  "sprint": 1,
  "assignedUser": "Esteban Muñoz"
}
```

### Users (legacy) — `/users`, `/adduser`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| GET | `/users/{id}` | Get user by ID |
| POST | `/adduser` | Create user |
| PUT | `/updateUser/{id}` | Update user |
| DELETE | `/deleteUser/{id}` | Delete user |

---

## Telegram Bot Commands

Bot username: `Oracle_420_bot`

| Command / Button | Action |
|---|---|
| `/start` | Show main menu with keyboard |
| `/hide` | Hide keyboard |
| `/todolist` | List all tasks |
| `Listar Tareas` | List all tasks (keyboard button) |
| `Nueva Tarea` | Prompt to add a task |
| `<text>` | Add new task (title only) |
| `<title>\|<desc>\|<priority>\|<date>\|<hours>` | Add task with full details (pipe-separated) |
| `<id>-DONE` | Mark task as completed |
| `<id>-UNDO` | Reopen a completed task |
| `<id>-DELETE` | Delete task |
| `/llm <prompt>` | Call DeepSeek AI (requires valid API key) |

**Rich task format example:**
```
Fix login bug | Auth fails on wrong password | alta | 2025-05-01 | 3
```
Fields: `Title | Description | Priority (alta/media/baja) | Due date (YYYY-MM-DD) | Estimated hours`

---

## Environment Variables Reference

These are injected at runtime by the Kubernetes manifests (from Secrets or literal values):

| Variable | Source | Description |
|---|---|---|
| `db_url` | literal | JDBC URL for Oracle ATP |
| `db_user` | literal | DB username (`ADMIN`) |
| `dbpassword` | Secret `dbuser` | DB password |
| `driver_class_name` | literal | `oracle.jdbc.OracleDriver` |
| `OCI_REGION` | literal | `mx-queretaro-1` |
| `TELEGRAM_BOT_TOKEN` | Secret `telegram-bot-secret` | Telegram bot token |
| `ui_username` | literal | Frontend basic auth username |
| `ui_password` | Secret `frontendadmin` | Frontend basic auth password |

For **local development**, all of these are overridden by `application-local.properties`.
