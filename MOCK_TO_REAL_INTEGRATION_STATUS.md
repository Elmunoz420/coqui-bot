# Mock to Real Integration Status

## Objective
Document the current state of the role-based frontend/backend integration, identify what is already connected to real backend data, what still depends on mock data, and define the minimum path to move the app toward real authentication and persistent backend-driven behavior.

## Executive Summary

Current readiness estimate:

- UI with real task data: `70-80%`
- Role-based dashboard behavior: `60%`
- Real authentication: `25-35%`
- Fully non-mock application flow: `50-60%`

In short:

- the project is already fairly close to using the real backend for tasks
- the admin and developer dashboards are structurally prepared
- the biggest remaining gap is authentication and user/session identity
- some dashboard behavior still falls back to mock data when backend calls fail

## What Is Already Connected to Real Backend Data

## 1. Task Fetching Is Already Backend-Aware
The shared frontend task hook already loads tasks from configurable backend endpoints.

That means the new UI is not purely visual; it already consumes real HTTP data.

Relevant behavior:

- admin flow uses `/todolist`
- developer flow uses `/todolist/my?username=...`

This is enabled through the shared task workspace hook.

## 2. Backend Now Exposes Role-Oriented Task Endpoints
The backend already has:

- `GET /todolist`
- `GET /todolist/my`

This means the architecture is no longer blocked on a single global task list.

## 3. Task Assignment Support Improved
Task creation/update now attempts to resolve the assigned user against the real `Usuario` model instead of always defaulting silently to the bot user.

This is important because a developer dashboard only makes sense if tasks can actually be linked to a specific user.

## 4. Basic Current-User Backend Lookup Exists
A lightweight `/auth/me` endpoint exists and can return a `Usuario` by username.

This is not real auth yet, but it is a useful bridge toward real identity-driven flows.

## What Still Depends on Mock Data

## 1. Session / Login Still Uses Mock Users
The current session state is still controlled in frontend memory/local storage through `AuthContext`.

The current login model is:

- choose admin
- choose developer
- persist a mocked user locally

That means:

- role is still frontend-defined
- current user identity is still frontend-defined
- route protection is still based on mock session state

This is the biggest reason the system is not yet "fully real".

## 2. Task Loading Still Falls Back to `MOCK_TASKS`
The shared task hook still includes preview mode fallback behavior.

If a task request fails, the app does this:

- enables preview mode
- loads `MOCK_TASKS`
- keeps the dashboard visually functional

This is good for demos and resilience, but it means the app can still silently leave real mode.

## 3. Activity Feed Is Still Frontend-Local
The current developer activity section is driven by local `activityLog` state inside the frontend hook.

That means:

- activity is not persisted in the database
- activity does not come from `HISTORIAL_TAREA`
- activity resets with frontend state/session behavior

So while the UI exists, it is not yet backed by historical backend data.

## 4. "Create Account" Is Still Visual Only
The new `Crear cuenta` button is currently just a UI CTA.

There is no:

- registration form
- create-user backend flow
- persistent account creation endpoint
- password/session setup

## Readiness by Area

## A. Admin Dashboard
Status: Mostly ready for real task data

The admin dashboard already works well with real backend tasks because:

- it loads tasks from `/todolist`
- it can create/update/delete through the backend
- it displays KPIs from loaded task data
- it already reflects real assignment and state changes when the backend responds correctly

Biggest remaining gaps:

- real authentication
- stronger role enforcement
- backend-driven team/activity data

## B. Developer Dashboard
Status: Partially real, partially mock-assisted

The developer dashboard is better than a pure mock because it already:

- requests `/todolist/my?username=...`
- renders personal tasks
- renders personal metrics based on loaded task data

But it still depends on mock behavior because:

- the username comes from mocked frontend identity
- fallback mode can still inject `MOCK_TASKS`
- activity is still local

## C. Authentication
Status: Not production-ready

This is the least ready area.

The current `/auth/me` endpoint is useful, but it still works like a development bridge, not real authentication.

What is missing:

- real login endpoint
- real session/token issuance
- backend-side current-user resolution
- real authorization checks

## D. KPI Layer
Status: Good enough for frontend-backed dashboards, not yet fully domain-backed

The KPI UI is functional and useful.

However:

- KPI derivation still mostly happens in frontend
- there is no dedicated backend KPI service yet
- there are no separate team/personal KPI endpoints beyond task-level derivation

This is acceptable for now, but not ideal long term.

## What Must Change to Leave Mock Mode

## 1. Replace Mock Auth Context with Real Identity Flow
The current `AuthContext` should stop defining users locally and instead do something like:

1. `POST /auth/login`
2. receive session/token
3. `GET /auth/me`
4. hydrate `user` from backend
5. route by backend-provided role

Until that happens, the app still controls identity in the frontend.

## 2. Disable Preview Fallback in Connected Environments
The `MOCK_TASKS` fallback should be limited to explicit preview/dev mode instead of being the default recovery path in all runtime environments.

Recommended direction:

- keep preview mode available for local demos
- gate it behind a feature flag or env
- do not silently fall back in connected/staging/prod environments

## 3. Move Activity to Backend History
The next natural source for dashboard activity is `HISTORIAL_TAREA`.

That would enable:

- recent activity based on real task events
- persistence
- per-user activity
- team-level activity for admin

Recommended future endpoints:

- `GET /activity/me`
- `GET /activity/team`
- `GET /tasks/{id}/history`

## 4. Add Real Account Creation
If `Crear cuenta` is meant to become functional, the project needs:

- registration form
- user creation endpoint
- account validation rules
- role assignment strategy

Possible backend direction:

- `POST /auth/register`
- or `POST /users`

depending on how auth is modeled.

## Minimum Path to Become "Semi-Real"

If the goal is to move quickly from mock-assisted mode to mostly real mode, the minimum practical sequence is:

1. connect `AuthContext` to `/auth/me`
2. add a temporary real login flow
3. stop using `MOCK_TASKS` by default in connected mode
4. keep task CRUD and task-by-user endpoints as the source of truth

At that point:

- dashboards would use real backend tasks
- routing would use real backend users
- role identity would no longer be frontend-invented

## Minimum Path to Become Fully Real

For a more complete production-like flow:

1. implement real login/session/JWT
2. implement backend role enforcement
3. use backend current-user resolution instead of query-param username
4. replace local activity with history-backed activity
5. implement real account creation
6. optionally add dedicated KPI endpoints

## Practical Assessment

## If the question is:
"Can we already connect the new UI to our current backend tasks?"

Answer:

Yes, mostly.

The task layer is already in decent shape for that.

## If the question is:
"Can we already stop being a mock-driven app completely?"

Answer:

Not yet.

The main blockers are:

- mock auth/session
- mock fallback data
- local activity feed
- missing real account creation

## Recommended Next Steps

## Phase 1: Real Identity Bridge
- replace `loginAs(...)` with backend lookup
- connect frontend session to `/auth/me`
- keep routing by role, but derive role from backend

## Phase 2: Disable Silent Mock Fallback
- add an explicit preview/dev flag
- prevent fallback to mock tasks in connected environments

## Phase 3: Backend Activity / History
- implement `HistorialTarea` support
- feed developer/admin activity cards from backend

## Phase 4: Real Registration / Auth
- add login + registration
- move from query-param identity to real session identity

## Final Conclusion

The current implementation is already a solid bridge between mock architecture and real backend integration.

What is already real enough:

- task fetching
- role-oriented dashboard structure
- task-by-user endpoint
- improved assignment behavior

What still keeps the system in mock-assisted mode:

- frontend-defined users
- frontend-controlled session state
- automatic `MOCK_TASKS` fallback
- frontend-only activity
- non-functional account creation

So the honest status is:

The app is already structurally ready to consume real backend task data, but it still needs authentication and identity migration work before it can be considered truly non-mock.

## Actionable Checklist

## Phase 1: Minimal Real Authentication
- [ ] Create `POST /auth/login`
- [ ] Define validation strategy for credentials
- [ ] Create `POST /auth/logout`
- [ ] Update `GET /auth/me` so it no longer depends on `username` query params
- [ ] Resolve the current user from session/token on the backend
- [ ] Return `id`, `username`, `name`, `role`, and `estado` to the frontend

## Phase 2: Frontend Without Mock Users
- [ ] Replace `MOCK_USERS` in `AuthContext`
- [ ] Replace `loginAs('admin' | 'developer')` with a real login call
- [ ] Persist session/token consistently
- [ ] Hydrate `user` from `GET /auth/me`
- [ ] Keep redirects by role, but derive role from backend data
- [ ] Make `logout()` clear real session state, not only local storage

## Phase 3: Disable Automatic Mock Task Fallback
- [ ] Identify all places where `useTaskWorkspace` falls back to `MOCK_TASKS`
- [ ] Add an explicit preview/dev mode flag
- [ ] In connected environments, show real API errors instead of mock data
- [ ] Keep `MOCK_TASKS` only for controlled local preview mode

## Phase 4: Real Tasks by User
- [ ] Confirm that `POST /todolist` persists `assignedUser` correctly
- [ ] Confirm that `PUT /todolist/{id}` updates or preserves assignment correctly
- [ ] Validate `GET /todolist/my` against real `USUARIO` data
- [ ] Update `GET /todolist/my` to resolve the authenticated user instead of relying on query params
- [ ] Verify that developer users only see their tasks
- [ ] Verify that admin users still see all tasks

## Phase 5: Real Role Enforcement
- [ ] Protect backend routes by role
- [ ] Restrict `POST /todolist` to admin users
- [ ] Restrict `DELETE /todolist/{id}` to admin users
- [ ] Restrict task edits according to business rules
- [ ] Protect frontend routes using backend-derived role data

## Phase 6: Real Activity and History
- [ ] Add entity/repository/service support for `HISTORIAL_TAREA`
- [ ] Create `GET /activity/me`
- [ ] Create `GET /activity/team`
- [ ] Create `GET /tasks/{id}/history`
- [ ] Replace local `activityLog` behavior in frontend with backend-driven data
- [ ] Render real activity in both admin and developer dashboards

## Phase 7: Real KPI Services
- [ ] Decide whether KPI logic stays in frontend or moves to backend
- [ ] If backend-driven, create `KpiService`
- [ ] Create `GET /kpis/me`
- [ ] Create `GET /kpis/team`
- [ ] Validate KPI calculations by sprint and by user
- [ ] Connect dashboard widgets to real KPI endpoints

## Phase 8: Real Account Creation
- [ ] Define registration flow
- [ ] Create `POST /auth/register` or `POST /users`
- [ ] Define the default role for new accounts
- [ ] Validate unique `username`
- [ ] Connect the `Crear cuenta` button to a real flow
- [ ] Add registration page or modal

## Phase 9: QA and Testing
- [ ] Test successful login
- [ ] Test redirect by role
- [ ] Test that admin sees all tasks
- [ ] Test that developer sees only assigned tasks
- [ ] Test that unauthenticated users are redirected to login
- [ ] Test that connected environments no longer silently fall back to mock data

## Recommended Order
1. Minimal real authentication
2. Frontend without `MOCK_USERS`
3. Remove automatic `MOCK_TASKS` fallback
4. Real tasks by user
5. Role enforcement
6. Real activity/history
7. KPI services
8. Real account creation
