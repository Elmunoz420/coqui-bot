# Role-Based Architecture Proposal

## Objective
Evolve `COQUI BOT` from a single hybrid dashboard into a role-based application with:

- `LandingPage`
- `LoginPage`
- `AdminDashboard`
- `DeveloperDashboard`

The goal is to reuse as much of the current UI as possible, keep deployment simple in OCI, and create a clean path toward role-based testing.

## Current Project Analysis

### Frontend
The current frontend is effectively a single-page admin-like interface:

- no routing
- no login/session handling
- no role-based rendering
- one large `App.js` that mixes:
  - task loading
  - task creation
  - filtering
  - global task table
  - KPI view

This means the current UI already behaves much closer to an admin or manager dashboard than a developer-focused workspace.

### Backend
The backend has the foundations for role support, but not the complete flow:

- `Usuario` already includes `username` and `rol`
- `Tarea` is the real entity behind tasks
- current security allows all requests
- the frontend consumes global task endpoints
- task assignment is not yet fully aligned with the selected assignee in the UI

There is also legacy user code (`User`, `UserController`, `UserService`) that is separate from the newer `Usuario`/`Tarea` model.

### OCI / Infrastructure
The current infrastructure is already sufficient for the next stage:

- one Spring Boot app
- one container image
- one OKE deployment
- one LoadBalancer
- one Oracle ATP database

Because of this, role-based UI does not require a new infrastructure topology.

## Recommended Architecture

## Product Direction
Keep the current UI as the base for `AdminDashboard`, and create a new `DeveloperDashboard` with a more focused, personal workflow.

This is the best fit because:

- the current UI already behaves like an admin/manager view
- it avoids throwing away existing work
- it creates a clear distinction between team supervision and individual execution
- it aligns well with the testing requirements for role-based dashboards

## Frontend Architecture
Use a single React SPA with routing and protected views instead of two separate apps.

### Target Structure

```text
src/
  app/
    router/
      AppRouter.js
      ProtectedRoute.js
    auth/
      AuthContext.js
      useAuth.js
  pages/
    LandingPage.js
    LoginPage.js
    AdminDashboard.js
    DeveloperDashboard.js
  features/
    tasks/
      components/
      hooks/
      services/tasksApi.js
      utils/taskMappers.js
    kpis/
      components/
      services/kpiApi.js
    auth/
      services/authApi.js
  components/
    layout/
      AppShell.js
      Sidebar.js
      Topbar.js
    common/
      SummaryCards.js
      StatusBadge.js
      PriorityBadge.js
```

### What Stays
The current UI should be reused as the base for `AdminDashboard`, especially:

- `Topbar`
- `SummaryCards`
- `TaskFilters`
- `TaskComposer`
- `TaskTable`
- `TaskDetailDrawer`
- `KPIDashboard`

### What Changes
`App.js` should stop being the full application shell and become a set of reusable pieces used by routed pages.

## Proposed Views

## 1. Landing Page
Purpose:

- branding
- system overview
- simple call to action
- entry point for both account types

Suggested content:

- hero section
- short product summary
- button to `Login`

## 2. Login Page
Two-stage approach:

### Phase 1
Simple mocked login or account selector:

- select `admin`
- select `developer`
- store session in memory or `localStorage`

### Phase 2
Real backend-backed authentication:

- login form
- fetch current user
- redirect by role

## 3. Admin Dashboard
This should be the evolution of the current UI.

Responsibilities:

- see all tasks
- create tasks
- assign tasks
- filter by sprint, priority, developer, status
- inspect task details
- review global KPIs
- supervise team progress

This matches the current structure very well and requires minimal redesign.

## 4. Developer Dashboard
This should be a new, focused workspace inspired by the mockups.

Responsibilities:

- see only personal tasks
- track personal sprint progress
- review individual KPIs
- complete assigned tasks
- inspect recent activity
- access quick actions

Suggested sections:

- greeting / personal summary
- task status overview
- sprint progress
- personal task table
- recent activity
- hours worked
- quick actions

## Role Model

## Admin
Admin should be able to:

- view all tasks
- create and assign tasks
- view team KPIs
- filter globally
- access broader project information

## Developer
Developer should be able to:

- view only assigned tasks
- update personal task progress
- mark assigned tasks as completed
- view personal KPIs
- inspect sprint progress

Developer should not be able to:

- create global tasks
- assign tasks to others
- manage all users
- access full team-level admin controls unless intentionally allowed

## Proposed Routes

```text
/           -> LandingPage
/login      -> LoginPage
/admin      -> AdminDashboard
/me         -> DeveloperDashboard
/forbidden  -> Access denied page
```

### Route Guards

- no session -> redirect to `/login`
- admin user -> allowed into `/admin`
- developer user -> allowed into `/me`
- role mismatch -> redirect to `/forbidden`

## Backend Proposal

## Source of Truth for Users
Use `Usuario` as the real identity and role model.

Do not build the new role-based flow on top of legacy `User`.

Why:

- `Usuario` already includes `username`
- `Usuario` already includes `rol`
- `Tarea` is related to `Usuario`
- it matches the current domain better than `User`

## Proposed Backend Layers

```text
controller/
  AuthController.java
  ToDoItemController.java
  KpiController.java
  UsuarioController.java

service/
  AuthService.java
  ToDoItemService.java
  KpiService.java
  UsuarioService.java

repository/
  UsuarioRepository.java
  TareaRepository.java
```

## Proposed Endpoints

### Auth

```text
POST /auth/login
GET /auth/me
POST /auth/logout
```

### Tasks

```text
GET /todolist              -> admin, all tasks
GET /todolist/my           -> developer, current user's tasks
GET /todolist/{id}
POST /todolist             -> admin
PUT /todolist/{id}         -> admin, or developer with restrictions
DELETE /todolist/{id}      -> admin
```

### KPIs

```text
GET /kpis/team
GET /kpis/team?sprint=1
GET /kpis/me
GET /kpis/me?sprint=1
```

### Users

```text
GET /users/me
GET /users                 -> admin
```

## Backend Service Changes

## 1. Authentication
Current security allows everything. That must evolve toward:

- login
- current-user lookup
- role-based authorization
- protected endpoints

Recommended progression:

### Phase 1
Keep auth simple:

- mocked login on frontend
- lightweight backend support if needed

### Phase 2
Implement real auth:

- session-based auth or JWT
- `GET /auth/me`
- role-based access checks

## 2. Task Assignment
Task assignment must become real and user-based.

Current behavior still defaults to the predefined user in important paths. For a true developer dashboard, tasks must be linked to the actual assigned `Usuario`.

New flow should be:

- admin creates task
- request includes `assignedUserId` or `assignedUsername`
- backend resolves the real `Usuario`
- task is persisted with that assignment
- `/todolist/my` returns only tasks for the logged-in developer

## 3. KPI Service
KPI calculation logic should gradually move from frontend-only derivation into a backend service.

Suggested responsibilities for `KpiService`:

- team hours by sprint
- team completed tasks by sprint
- per-user hours by sprint
- per-user completed tasks by sprint

This gives:

- better consistency
- lighter frontend logic
- easier backend testing
- clearer API contracts

## OCI / Infrastructure Proposal

## What Can Stay the Same
No major OCI redesign is required for the role-based architecture.

You can keep:

- one app image in `OCIR`
- one `Deployment`
- one `LoadBalancer`
- one namespace
- one database

This is important: admin and developer views do not require separate deployments.

## What Will Change Later
When authentication becomes real, OCI will likely need additional config:

- auth secret
- JWT/session secret
- seeded admin credentials or initial user setup
- possibly additional environment variables

Examples:

```text
JWT_SECRET
APP_SESSION_SECRET
DEFAULT_ADMIN_PASSWORD
```

## Recommended Implementation Phases

## Phase 1: UI Separation
Goal: separate the experience visually and functionally without waiting for full backend auth.

Tasks:

1. add routing
2. create `LandingPage`
3. create `LoginPage`
4. move current UI into `AdminDashboard`
5. create `DeveloperDashboard`
6. add mock auth context
7. protect routes by role in frontend

Outcome:

- real role-based UI
- faster progress
- easier demo
- viable frontend tests

## Phase 2: Backend Role Alignment
Goal: make the UI backed by real role-aware data.

Tasks:

1. use `Usuario` as identity source
2. add `AuthController`
3. add `/auth/me`
4. implement real task assignment
5. add `/todolist/my`
6. add team vs personal KPI endpoints

Outcome:

- developer sees real assigned tasks
- admin sees true global view
- backend supports role-based contracts

## Phase 3: Security and OCI Hardening
Goal: productionize the role model.

Tasks:

1. lock down Spring Security
2. add auth secrets in Kubernetes
3. update deployment env vars
4. rollout updated image

Outcome:

- protected routes
- secure role-aware access
- OCI remains simple but more robust

## Testing Strategy

## Admin Tests
Suggested frontend tests:

- renders global KPIs
- renders task creation controls
- renders full task list
- allows filtering by developer/sprint
- shows KPI dashboard tab and data

## Developer Tests
Suggested frontend tests:

- renders only personal task view
- hides admin-only controls
- allows completing assigned task
- shows personal progress widgets
- shows personal KPI data

## Routing / Auth Tests
Suggested frontend tests:

- unauthenticated user is redirected to login
- admin is redirected to `/admin`
- developer is redirected to `/me`
- developer cannot access admin route

## Final Recommendation
The best approach for this project is:

1. keep the current UI as `AdminDashboard`
2. build a dedicated `DeveloperDashboard`
3. use one React app with role-based routes
4. use `Usuario` as the real backend user model
5. keep the current OCI topology
6. first separate the UI, then align backend and auth

This balances:

- speed of implementation
- reuse of current work
- clarity of product design
- testability
- low infrastructure risk

## Suggested Execution Order

1. router + mock auth
2. landing page + login page
3. extract current UI into `AdminDashboard`
4. build `DeveloperDashboard`
5. add frontend role-based tests
6. align backend with `Usuario`
7. add `/auth/me` and `/todolist/my`
8. tighten security and secrets in OCI

## DB Schema Update Addendum

This section updates the proposal based on the newer database design shared later in the discussion.

## New Schema Summary
The updated schema confirms and strengthens the role-based direction of the project.

Relevant tables now visible in the design:

- `USUARIO`
- `TAREA`
- `PROYECTO`
- `HISTORIAL_TAREA`
- `INTERACCION_BOT`
- `SUGERENCIA_IA`
- `LOGS`

This is important because the database now clearly supports:

- user roles
- task assignment
- task history / audit trails
- bot interactions
- AI suggestions
- richer operational reporting

## Impact on the Proposal

### 1. `Usuario` Is Confirmed as the Correct Identity Model
The new schema makes it clear that the role-based system should be built on `USUARIO`, not on the legacy `USERS` table.

Reasons:

- `USUARIO` has `USERNAME`
- `USUARIO` has `ROL`
- `USUARIO` has `ESTADO`
- `TAREA` references `ID_USUARIO_ASIGNADO`
- `HISTORIAL_TAREA` also references user actions

This means the proposal should now treat legacy `User` as technical debt and keep all new work centered on `Usuario`.

### 2. `TAREA` Now Supports a Better Admin / Developer Split
The updated schema suggests a richer `TAREA` model with fields like:

- assignment to real users
- `UPDATED_AT`
- `SOURCE_CHANNEL`
- sprint linkage
- estimated and real hours

This directly improves the architecture:

- `AdminDashboard` can supervise all tasks and filter by source, sprint, user, and status
- `DeveloperDashboard` can show assigned tasks, recent changes, and personal work history

### 3. `HISTORIAL_TAREA` Enables Real Activity Feeds
This is one of the most valuable changes in the schema.

With `HISTORIAL_TAREA`, the app can support:

- recent activity panels
- task timelines
- audit trails
- "who changed what" reporting
- personal activity widgets for developer view

This means the proposed `DeveloperDashboard` can move beyond just "my tasks" and become a true personal workspace.

### 4. `INTERACCION_BOT` and `SOURCE_CHANNEL` Improve Traceability
The updated schema suggests better visibility into how tasks and actions enter the system.

That opens the door for future admin features like:

- filtering tasks created from Telegram vs dashboard
- analyzing bot usage
- showing origin badges on tasks
- understanding whether work was initiated through chat or UI

### 5. `SUGERENCIA_IA` and `LOGS` Create Future Expansion Paths
These tables are not required to separate admin and developer UI immediately, but they are useful for future roadmap work:

- AI suggestions per task
- suggestion history
- field-level change tracking
- operational auditing

For the current phase, they should be considered optional integrations, not blockers.

## Updated Backend Recommendation

## Core Domain Priority
The backend should now be explicitly organized around these domain entities:

- `Usuario`
- `Tarea`
- `Proyecto`
- `HistorialTarea`

And later, optionally:

- `InteraccionBot`
- `SugerenciaIA`
- `TaskLog`

## Recommended New Entity Work
To align code with the updated database, the next backend modeling steps should be:

1. extend `Tarea` to match the new schema fields
2. add `HistorialTarea` entity
3. add repository/service support for task history
4. optionally add entities for `InteraccionBot`, `SugerenciaIA`, and `Logs`

## Updated `Tarea` Expectations
The `Tarea` entity should eventually include support for fields such as:

- `updatedAt`
- `sourceChannel`
- assigned user relation
- project relation
- sprint
- title / description
- status / priority
- estimated hours / real hours
- created / due / close timestamps

This matters because the UI proposal can now rely on richer domain data instead of frontend-only derivation.

## New Services Recommended
The previous service proposal remains valid, but the new schema suggests clearer service responsibilities:

```text
service/
  AuthService.java
  UsuarioService.java
  ToDoItemService.java
  KpiService.java
  HistorialTareaService.java
  ActivityFeedService.java
```

Suggested responsibilities:

- `AuthService`: login, current user, role checks
- `UsuarioService`: user lookup and role-aware access helpers
- `ToDoItemService`: task CRUD and task queries
- `KpiService`: team and personal KPI aggregation
- `HistorialTareaService`: task timeline and audit history
- `ActivityFeedService`: recent activity for dashboards

## Updated API Proposal

### Existing Direction That Still Stands

```text
POST /auth/login
GET /auth/me
POST /auth/logout

GET /todolist
GET /todolist/my
GET /todolist/{id}
POST /todolist
PUT /todolist/{id}
DELETE /todolist/{id}

GET /kpis/team
GET /kpis/me
```

### New Endpoints Enabled by the Schema

```text
GET /tasks/{id}/history
GET /activity/me
GET /activity/team
GET /tasks?source=telegram
GET /tasks?source=web
GET /users/me/activity
```

These are not all mandatory for phase 1, but they now have a strong database basis.

## Updated UI Implications

## Admin Dashboard
With the new schema, `AdminDashboard` can evolve to include:

- full task supervision
- filters by developer, sprint, status, priority, source channel
- team KPI summaries
- recent team activity feed
- task history access
- future AI suggestion visibility

## Developer Dashboard
With the new schema, `DeveloperDashboard` can be defined more clearly as:

- my assigned tasks
- my sprint progress
- my completed vs pending work
- my recent activity from `HISTORIAL_TAREA`
- my hours worked
- task-level change history

This is a stronger definition than the earlier version, because the database now explicitly supports these experiences.

## Testing Impact
The DB update helps the testing plan because it provides cleaner domain boundaries.

### New Candidate Tests

- developer sees only tasks assigned through `ID_USUARIO_ASIGNADO`
- developer activity feed shows recent actions from task history
- admin sees team-wide activity feed
- admin can filter tasks by `sourceChannel`
- history panel renders timeline entries correctly

### Still Recommended as First Priority
Even with the richer schema, the best initial testing path remains:

1. separate admin and developer UI
2. use mocked auth first if necessary
3. write role-based frontend tests
4. then align backend entities and APIs to the new schema

## Updated Recommendation
The schema change does not invalidate the proposal. It improves it.

The proposal should now be interpreted as:

1. current UI becomes `AdminDashboard`
2. new focused personal UI becomes `DeveloperDashboard`
3. `Usuario` is the canonical identity model
4. `Tarea` should be extended to match the real DB schema
5. `HistorialTarea` should become a first-class part of the application
6. OCI can remain structurally the same while backend capabilities expand

## Updated Immediate Priorities
If the priority is still frontend testing and UI separation, the best immediate order is now:

1. split current UI into `AdminDashboard`
2. build a minimal `DeveloperDashboard`
3. add mock role-based routing
4. write role-based frontend tests
5. align backend `Tarea` and `Usuario` usage
6. add `HistorialTarea` support
7. expose personal activity and task history APIs

This keeps momentum on testing while making sure the next backend iteration follows the new database correctly.

