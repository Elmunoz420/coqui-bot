# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> developer session is blocked from /admin and redirected to /me
- Location: e2e\auth.spec.ts:194:8

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/admin$/
Received string:  "http://localhost:3000/me"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × unexpected value "http://localhost:3000/me"

```

```yaml
- complementary:
  - text: COQUI BOT Developer Workspace Developer Workspace
  - navigation:
    - button "Resumen"
    - button "Mis tareas"
    - button "Calendario"
    - button "Actividad"
    - button "Reportes"
  - text: TD
  - strong: Test Developer
  - text: developer
  - button "Salir"
- text: ● Conectado
- button "Notificaciones"
- main:
  - heading "Hola Test 👋" [level=1]
  - paragraph: Aquí tienes tus tareas, próximos vencimientos y progreso del día.
  - text: 0% Sprint 1
  - strong: Progreso personal
  - paragraph: 0 de 0 tareas completadas
  - text: 🐸
  - strong: "!"
  - text: MVP
  - region "Resumen de tareas":
    - article:
      - paragraph: Mis tareas
      - paragraph: "0"
      - paragraph: Asignadas a ti
    - article:
      - paragraph: En progreso
      - paragraph: "0"
      - paragraph: Trabajando en ellas
    - article:
      - paragraph: Completadas
      - paragraph: "0"
      - paragraph: Buen trabajo
    - article:
      - paragraph: Vencidas
      - paragraph: "0"
      - paragraph: Vas al día
  - button "Resumen"
  - button "Mis tareas"
  - button "Calendario"
  - region "Coqui suggestion":
    - heading "Coqui suggestion" [level=2]
    - paragraph: Cargando recomendaciones personales...
    - strong: Estado
    - text: Conectando con Coqui... Espacio reservado para conectar recomendaciones generadas por IA.
  - article:
    - heading "Foco de trabajo" [level=2]
    - paragraph: Sprint 1 · 0 tareas activas
    - text: En progreso
    - paragraph: No tienes tareas asignadas por el momento.
    - button "Ver todas mis tareas"
  - article:
    - heading "Siguiente entrega" [level=2]
    - paragraph: Prioridad inmediata
    - paragraph: No tienes vencimientos próximos.
  - article:
    - heading "Actividad reciente" [level=2]
    - paragraph: Últimos cambios
    - strong: Preview local activado con tareas mock
    - text: 11/6/2026, 11:24:04 p.m.
  - strong: 0h
  - text: Horas
  - strong: 0%
  - text: Progreso
  - strong: "0"
  - text: Tareas activas
  - strong: "0"
  - text: Completadas
  - strong: 0h
  - text: Horas registradas
- button "Abrir chat de Coqui"
```

# Test source

```ts
  110 |     await page.locator('input[name="username"]').fill(TEST_DEV.username);
  111 |     await page.locator('input[name="password"]').fill('any_password');
  112 |     await page.getByRole('button', { name: /Ingresar/i }).click();
  113 | 
  114 |     await page.waitForURL('**/me');
  115 |     await expect(page).toHaveURL(/\/me$/);
  116 | 
  117 |     // Soft: sidebar shows the user's name.
  118 |     await expect.soft(page.getByText(TEST_DEV.name)).toBeVisible();
  119 |   });
  120 | 
  121 |   // ── Admin redirect ────────────────────────────────────────────────────────
  122 | 
  123 |   test('redirects admin to /admin after login', async ({ page }) => {
  124 |     await page.route(API_AUTH_LOGIN, (route) =>
  125 |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_ADMIN) }),
  126 |     );
  127 |     await mockEmptyTasks(page);
  128 |     await silenceAI(page);
  129 | 
  130 |     await page.locator('input[name="username"]').fill(TEST_ADMIN.username);
  131 |     await page.locator('input[name="password"]').fill('admin_pass');
  132 |     await page.getByRole('button', { name: /Ingresar/i }).click();
  133 | 
  134 |     await page.waitForURL('**/admin');
  135 |     await expect(page).toHaveURL(/\/admin$/);
  136 | 
  137 |     // exact:true prevents matching <h1>¡Bienvenido, Test Admin!</h1> as well as
  138 |     // the sidebar <strong>Test Admin</strong> — without it, strict mode fires.
  139 |     await expect.soft(page.getByText(TEST_ADMIN.name, { exact: true })).toBeVisible();
  140 |   });
  141 | 
  142 |   // ── localStorage persistence (annotated as slow) ──────────────────────────
  143 | 
  144 |   // @annotation: test.slow() — verifies an async side-effect (localStorage write)
  145 |   // which may take a render cycle longer on CI runners.
  146 |   test.slow('persists session to localStorage after successful login', async ({ page }) => {
  147 |     await page.route(API_AUTH_LOGIN, (route) =>
  148 |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_DEV) }),
  149 |     );
  150 |     await mockEmptyTasks(page);
  151 | 
  152 |     await page.locator('input[name="username"]').fill(TEST_DEV.username);
  153 |     await page.locator('input[name="password"]').fill('password');
  154 |     await page.getByRole('button', { name: /Ingresar/i }).click();
  155 | 
  156 |     await page.waitForURL('**/me');
  157 | 
  158 |     const raw = await page.evaluate((key: string) => localStorage.getItem(key), STORAGE_KEY);
  159 |     const session = JSON.parse(raw!);
  160 | 
  161 |     expect(session.username).toBe(TEST_DEV.username);
  162 |     expect(session.role).toBe('developer');
  163 |     // Soft assertions on optional fields.
  164 |     expect.soft(session.name).toBe(TEST_DEV.name);
  165 |     expect.soft(session.id).toBe(TEST_DEV.id);
  166 |   });
  167 | 
  168 |   // ── Mode toggle ───────────────────────────────────────────────────────────
  169 | 
  170 |   test('toggles between login and register modes', async ({ page }) => {
  171 |     // Default: login mode.
  172 |     await expect(page.getByRole('heading', { name: /Iniciar sesión/i })).toBeVisible();
  173 |     // The "name" field only shows in register mode.
  174 |     await expect.soft(page.locator('input[name="name"]')).not.toBeVisible();
  175 | 
  176 |     await page.getByRole('button', { name: /Crear cuenta/i }).click();
  177 | 
  178 |     await expect(page.getByRole('heading', { name: /Crear cuenta/i })).toBeVisible();
  179 |     await expect(page.locator('input[name="name"]')).toBeVisible();
  180 |     // Role selector is also register-only.
  181 |     await expect.soft(page.locator('select[name="role"]')).toBeVisible();
  182 | 
  183 |     await page.getByRole('button', { name: /Ya tengo cuenta/i }).click();
  184 |     await expect(page.getByRole('heading', { name: /Iniciar sesión/i })).toBeVisible();
  185 |     await expect(page.locator('input[name="name"]')).not.toBeVisible();
  186 |   });
  187 | 
  188 |   // ── test.fail: access-control guard ──────────────────────────────────────
  189 | 
  190 |   // @annotation: test.fail() — documents a known behavioral guard at the route level.
  191 |   // A developer session navigating directly to /admin is redirected by ProtectedRoute.
  192 |   // The assertion `toHaveURL(/\/admin$/)` is EXPECTED to fail (developer lands on /me).
  193 |   // test.fail() inverts the outcome: the test PASSES precisely because the assertion fails.
  194 |   test.fail('developer session is blocked from /admin and redirected to /me', async ({ page }) => {
  195 |     // Network-level mock: inject developer session via localStorage init-script
  196 |     // so the auth context loads without touching the real /auth/login endpoint.
  197 |     await page.addInitScript(
  198 |       ({ key, value }: { key: string; value: unknown }) => {
  199 |         localStorage.setItem(key, JSON.stringify(value));
  200 |       },
  201 |       { key: STORAGE_KEY, value: TEST_DEV },
  202 |     );
  203 |     // Intercept at the network level — no real backend call is made.
  204 |     await page.route(API_TASKS, (route) =>
  205 |       route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  206 |     );
  207 |     await page.goto('/admin');
  208 |     // ProtectedRoute redirects the developer to /me, so this assertion FAILS,
  209 |     // which is the expected outcome when test.fail() is in effect.
> 210 |     await expect(page).toHaveURL(/\/admin$/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  211 |   });
  212 | 
  213 |   // ── HAR mock: login ───────────────────────────────────────────────────────
  214 | 
  215 |   // @annotation: @har — demonstrates page.routeFromHAR() for network-level replay.
  216 |   // The HAR file at e2e/fixtures/login.har contains a pre-recorded POST /auth/login
  217 |   // response.  Playwright intercepts the request and serves the stored response
  218 |   // without ever reaching the real backend.
  219 |   test('logs in using HAR-mocked /auth/login response', { tag: '@har' }, async ({ page }) => {
  220 |     // Serve POST /auth/login from the HAR file.
  221 |     // notFound: 'fallthrough' passes any unmatched URL (e.g. /todolist) to the
  222 |     // next handler registered below, so only the login call is HAR-sourced.
  223 |     await page.routeFromHAR(
  224 |       path.join(__dirname, 'fixtures/login.har'),
  225 |       {
  226 |         url: '**/auth/login',
  227 |         notFound: 'fallthrough',
  228 |       },
  229 |     );
  230 | 
  231 |     // Mock the task-list endpoint that the dashboard fetches after login.
  232 |     await page.route(API_TASKS, (route) =>
  233 |       route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  234 |     );
  235 | 
  236 |     // Navigate to root — no session present, so ProtectedRoute lands on /login.
  237 |     await page.goto('/');
  238 |     await expect(page).toHaveURL(/\/login/);
  239 | 
  240 |     // Fill credentials matching the HAR entry (HAR matches on URL+method, not body).
  241 |     await page.locator('input[name="username"]').fill(TEST_DEV.username);
  242 |     await page.locator('input[name="password"]').fill('any_password');
  243 |     await page.getByRole('button', { name: /Ingresar/i }).click();
  244 | 
  245 |     // HAR fulfills the 200 → AuthContext stores the session → redirects to /me.
  246 |     await page.waitForURL('**/me');
  247 |     await expect(page).toHaveURL(/\/me$/);
  248 |   });
  249 | });
  250 | 
```