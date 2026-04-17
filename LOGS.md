# LOGS.md — Change Log & Issue Tracker

## Current Issues Summary

| ID | Severity | File | Description | Status |
|----|----------|------|-------------|--------|
| ISSUE-001 | HIGH | `config/OracleConfiguration.java` | Dual DataSource config: env vars override application.properties, breaks local dev | **FIXED 2026-04-14** |
| ISSUE-002 | HIGH | `resources/application.properties` | Real DB password and Telegram token committed in plain text | **FIXED 2026-04-14** |
| ISSUE-003 | LOW | `deploy-final.yaml:55` | Legacy env var `todo.table.name=todoitem` still present | **FIXED 2026-04-14** |
| ISSUE-004 | MED | `util/BotActions.java:139` | `fnHide()` operator precedence bug — HIDE_COMMAND ignores `exit` flag | Open |
| ISSUE-005 | MED | `util/BotActions.java:327` | `fnLLM()` ignores user input, always sends hardcoded weather prompt | Open |
| ISSUE-006 | MED | `resources/application.properties` | DeepSeek API key is placeholder `sk-test`, LLM feature non-functional | Open |
| ISSUE-007 | LOW | `util/MyTodoListBot.java,prop` | File with comma in name — unknown origin, not compiled by Maven | Open |
| ISSUE-008 | LOW | `frontend/src/App.js:236` | Typo: `reloadOneIteam` should be `reloadOneItem` | Open |
| ISSUE-009 | LOW | `model/User.java` + `service/UserService.java` | Legacy USERS table code co-exists with USUARIO — no connection to main flows | Open |
| ISSUE-010 | LOW | `resources/application.properties` | `spring.jpa.hibernate.ddl-auto=update` causes ORA-01439 WARNs on startup — Hibernate tries to ALTER non-empty timestamp columns | Open |
| ISSUE-011 | LOW | `resources/application.properties` | `spring.jpa.database-platform=Oracle12cDialect` deprecated; min supported is 19.0.0 — should use `OracleDialect` | Open |

---

## Detailed Issue Notes

### ISSUE-001: OracleConfiguration DataSource Conflict

**Root cause:** `OracleConfiguration.java` defines a `@Bean DataSource` that reads four env vars:
```java
ds.setDriverType(env.getProperty("driver_class_name"));
ds.setURL(env.getProperty("db_url"));
ds.setUser(env.getProperty("db_user"));
ds.setPassword(env.getProperty("dbpassword"));
```
In Kubernetes these come from the deployment spec. Locally they are not set, so all become `null`, and the Oracle driver throws at startup.

Meanwhile `application.properties` has `spring.datasource.*` fully configured but Spring's auto-configuration is suppressed by the explicit `@Bean`.

**Fix options:**
- Option A: Make `OracleConfiguration` conditional (`@ConditionalOnMissingBean` or profile-based)
- Option B: Delete `OracleConfiguration.java` and let Spring Boot auto-configure the datasource from `application.properties`; pass secrets via env vars that `application.properties` reads with `${db_url:${spring.datasource.url}}`
- Option C (quickest local workaround): Set env vars before running:
  ```bash
  export db_url="jdbc:oracle:thin:@taskbotdb_medium?TNS_ADMIN=./wallet"
  export db_user="ADMIN"
  export dbpassword="BotTareas_2026_Oracle#1"
  export driver_class_name="oracle.jdbc.OracleDriver"
  ```

---

### ISSUE-002: Hardcoded Credentials

`application.properties` contains:
```
spring.datasource.password=BotTareas_2026_Oracle#1
telegram.bot.token=8244418263:AAEMTVDqQs1yNnBhF3nG_ngDo4djWOsHq4g
```

These must not remain in version control. Recommended fix:
1. Add `application.properties` to `.gitignore`
2. Create `application-local.properties.template` with placeholder values
3. Read secrets from env vars:
   ```properties
   spring.datasource.password=${DB_PASSWORD}
   telegram.bot.token=${TELEGRAM_BOT_TOKEN}
   ```

---

### ISSUE-004: fnHide() Logic Bug

Current code (BotActions.java:139):
```java
if (requestText.equals(BotCommands.HIDE_COMMAND.getCommand())
    || requestText.equals(BotLabels.HIDE_MAIN_SCREEN.getLabel()) && !exit)
    BotHelper.sendMessageToTelegram(chatId, BotMessages.BYE.getMessage(), telegramClient);
else
    return;
```

Java operator precedence: `&&` before `||`. Actual evaluation:
```
(HIDE_COMMAND) || (HIDE_MAIN_SCREEN && !exit)
```

The `/hide` command path never checks `exit`, so it can respond even if a previous action already handled the message. Should be:
```java
if ((requestText.equals(BotCommands.HIDE_COMMAND.getCommand())
    || requestText.equals(BotLabels.HIDE_MAIN_SCREEN.getLabel())) && !exit)
```

---

## Change History

### 2026-04-17 — KPI dashboard fixes, model fields, build config

**Backend:**
- `Tarea.java` — Added `@Column(name = "SPRINT") Integer sprint` and `@Transient String assignedUser` (computed from `usuarioAsignado.getNombre()`). Both fields now flow through `ToDoItemService` → `ToDoItem` DTO → `GET /todolist` JSON response.
- `ToDoItem.java` — Added `Integer sprint` and `String assignedUser` fields with getters/setters.
- `ToDoItemService.java` — `tareaToToDoItem()` maps both new fields; `applyToDoItemToTarea()` and `addToDoItem()` propagate `sprint`.
- `pom.xml` — Changed `<java.version>` from `11` to `17`. Spring Boot 3.x requires Java 17+; JDK 21 (Temurin) is installed and compatible.
- `application-local.properties` — Added `oracle.jdbc.fanEnabled=false` and explicit `spring.jpa.properties.hibernate.dialect` for Oracle ATP local dev.

**Frontend — KpiDashboard.js:**
- Added `'Sprint 0'` to `ACTIVE_SPRINTS` and `SPRINT_COLORS` (`#A78BFA`).
- Fixed `getSprintName()`: integer sprint field (e.g. `1`) now maps directly to `"Sprint 1"` before falling back to text search in `descripcion`. Previous fix (`String(t.sprint || '')`) was silently dropping sprint `0` (falsy) and never matching any sprint name via substring.
- Fixed `getDevName()`: now case-insensitive (`.toLowerCase()` on both sides). Previously `"esteban"` would not match `"Esteban"`.
- Updated `MEMBER_COLORS` to high-contrast dark-background palette: Joaquín `#4A9EFF`, Esteban `#FF6B35`, Juan Pablo `#51CF66`, Fernanda `#FF6B9D`, Emilio `#FFD43B`.
- Added `MEMBER_DASH` map: Esteban `8 4`, Fernanda `4 4`, Emilio `2 4` — distinct dash patterns for overlapping lines.
- Line chart: `strokeWidth` 2.5→3, dots `r` 4→6 with halo stroke. Dashed series sorted last in SVG render order so they paint on top of solid lines. Esteban's dashed lines get `strokeWidth=4`.
- Line chart: `xPos()` fixed for single-sprint edge case; `chartW` 500→600; SVG made responsive via `viewBox` + `width="100%"`.
- X-axis baseline moved before `{/* Lines */}` so zero-value lines are not painted over.
- `chart2Series` filtered to exclude developers with all-zero hours before passing to `LineChart` (avoids phantom zero lines on first render before API resolves).
- All chart text colours updated to `#FFFFFF` / `rgba(255,255,255,x)` for dark background readability. Chart card borders changed to `rgba(255,255,255,0.15)`.
- Font sizes: titles `20px`, subtitles/legend `14px`, axis labels/values `13px`, bar value labels `13px`. Card padding increased to `2rem`.

**Frontend — TaskComposer.js:**
- Fixed `generarTaskId()`: integer `t.sprint` (e.g. `1`) now maps to `"Sprint 1"` directly (`\`Sprint ${t.sprint}\` === sprint`), falling back to text search in `descripcion`. Previous string-conversion approach was comparing `"1".includes("sprint 1")` → always false.

---

### 2026-04-14 — Major architecture migration (inferred from code state)

**Changed:**
- `ToDoItemRepository.java` — **DELETED**. Was a JPA repository for the old TODOITEM table.
- `ToDoItem.java` — Converted from JPA entity to DTO. All `@Entity`, `@Table`, `@Id` annotations commented out. Added new fields: `descripcion`, `prioridad`, `estado`, `fechaLimite`, `horasEstimadas`, `horasReales`.
- `ToDoItemService.java` — Fully rewritten to use `TareaRepository` internally. Exposes same public API but now persists to TAREA table. Added `@PostConstruct` to create default usuario + proyecto.
- `BotActions.java` — Added `formatPriority()`, `formatDueDate()`, pipe-format parsing in `fnElse()`, DeepSeek integration.
- `BotLabels.java` — Renamed `LIST_ALL_ITEMS` to "Listar Tareas", `ADD_NEW_ITEM` to "Nueva Tarea", `MY_TODO_LIST` to "COQUI BOT".
- `BotMessages.java` — All messages updated to Spanish.
- `App.js` — Refactored to use new components (Topbar, SummaryCards, TaskComposer, TaskFilters, TaskTable, TaskDetailDrawer, BotActivityPanel). Added `normalizeTask()`, metrics calculation, filter state.
- `NewItem.js` — Modified (details not reviewed in this session).

**Added:**
- `Tarea.java` — New JPA entity for TAREA table
- `Usuario.java` — New JPA entity for USUARIO table
- `Proyecto.java` — New JPA entity for PROYECTO table
- `TareaRepository.java` — JPA repo for TAREA
- `UsuarioRepository.java` — JPA repo for USUARIO
- `ProyectoRepository.java` — JPA repo for PROYECTO
- `frontend/src/components/` — 9 new UI components
- `frontend/src/styles/darkTheme.css` — Dark theme styles
- `deploy-final.yaml` — New K8s deployment manifest
- `DockerfileDev` — Dev-mode Dockerfile variant
- `config/DeepSeekConfig.java` — HTTP client config for DeepSeek
- `service/DeepSeekService.java` — DeepSeek API integration
- `util/BotClient.java` — (file present, not reviewed)

---

## Pending Fixes (Priority Order)

1. ~~**[HIGH]** Fix `OracleConfiguration.java` to support local dev without env vars (ISSUE-001)~~ — DONE 2026-04-14
2. ~~**[HIGH]** Remove credentials from `application.properties`, use env var substitution (ISSUE-002)~~ — DONE 2026-04-14
3. **[MED]** Fix `fnHide()` operator precedence bug (ISSUE-004)
4. **[MED]** Make `fnLLM()` pass user's actual prompt to DeepSeek (ISSUE-005)
5. **[MED]** Provide real DeepSeek API key or disable the LLM command gracefully (ISSUE-006)
6. ~~**[LOW]** Change `todo.table.name` in `deploy-final.yaml` from `todoitem` to `tarea` (ISSUE-003)~~ — DONE 2026-04-14
7. **[LOW]** Change `ddl-auto=update` to `ddl-auto=validate` to stop ORA-01439 WARNs (ISSUE-010)
8. **[LOW]** Replace deprecated `Oracle12cDialect` with `OracleDialect` (ISSUE-011)
9. **[LOW]** Investigate and delete `MyTodoListBot.java,prop` (ISSUE-007)
10. **[LOW]** Fix `reloadOneIteam` typo in `App.js` (ISSUE-008)
11. **[LOW]** Evaluate whether `User`/`UserController`/`USERS` table is still needed or can be removed (ISSUE-009)
