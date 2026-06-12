# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task-crud.spec.ts >> Admin Dashboard — Task CRUD >> [parameterized] creates "Write E2E tests" with priority=alta
- Location: e2e\task-crud.spec.ts:186:9

# Error details

```
"afterAll" hook timeout of 30000ms exceeded.
```

# Test source

```ts
  49  | 
  50  |     if (method === 'GET') {
  51  |       await route.fulfill({
  52  |         status: 200,
  53  |         contentType: 'application/json',
  54  |         body: JSON.stringify(store.tasks),
  55  |       });
  56  |       return;
  57  |     }
  58  | 
  59  |     if (method === 'POST') {
  60  |       const body = route.request().postDataJSON() as Partial<Task>;
  61  |       const created: Task = {
  62  |         id: Date.now(),
  63  |         description: body.description ?? body.titulo ?? 'Nueva tarea',
  64  |         titulo: body.titulo ?? body.description,
  65  |         descripcion: body.descripcion ?? '',
  66  |         prioridad: body.prioridad ?? 'media',
  67  |         estado: 'pendiente',
  68  |         done: false,
  69  |         createdAt: new Date().toISOString(),
  70  |         fechaLimite: body.fechaLimite ?? null,
  71  |         horasEstimadas: body.horasEstimadas ?? 0,
  72  |         horasReales: 0,
  73  |         assignedUser: body.assignedUser ?? 'Sin asignar',
  74  |         sprint: body.sprint ?? null,
  75  |         taskId: body.taskId ?? null,
  76  |       };
  77  |       store.tasks = [created, ...store.tasks];
  78  |       await route.fulfill({
  79  |         status: 201,
  80  |         headers: { location: String(created.id) },
  81  |         body: '',
  82  |       });
  83  |       return;
  84  |     }
  85  | 
  86  |     await route.continue();
  87  |   });
  88  | 
  89  |   // Individual task endpoint: PUT (update) and DELETE.
  90  |   await page.route(API_TASK_BY_ID, async (route) => {
  91  |     const method = route.request().method();
  92  |     const url = route.request().url();
  93  |     const id = url.split('/todolist/')[1]?.split('?')[0];
  94  | 
  95  |     if (method === 'PUT') {
  96  |       const body = route.request().postDataJSON() as Partial<Task>;
  97  |       store.tasks = store.tasks.map((t) =>
  98  |         String(t.id) === id ? { ...t, ...body } : t,
  99  |       );
  100 |       const updated = store.tasks.find((t) => String(t.id) === id);
  101 |       await route.fulfill({
  102 |         status: 200,
  103 |         contentType: 'application/json',
  104 |         body: JSON.stringify(updated ?? { id }),
  105 |       });
  106 |       return;
  107 |     }
  108 | 
  109 |     if (method === 'DELETE') {
  110 |       store.tasks = store.tasks.filter((t) => String(t.id) !== id);
  111 |       await route.fulfill({ status: 204, body: '' });
  112 |       return;
  113 |     }
  114 | 
  115 |     await route.continue();
  116 |   });
  117 | 
  118 |   // Silence AI endpoints that AdminDashboard pings on mount.
  119 |   await page.route(API_AI_INSIGHTS, (route) =>
  120 |     route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  121 |   );
  122 | }
  123 | 
  124 | // ─── Parameterized task data ───────────────────────────────────────────────────
  125 | // Drives the for-loop below: each entry produces one fully independent test
  126 | // that shares the same beforeEach/afterAll lifecycle and route mocks.
  127 | 
  128 | const PARAMETERIZED_TASKS = [
  129 |   { title: 'Write E2E tests',           hours: '2',   priority: 'alta'  },
  130 |   { title: 'Update documentation',       hours: '1',   priority: 'media' },
  131 |   { title: 'Fix priority badge colours', hours: '0.5', priority: 'baja'  },
  132 | ] as const;
  133 | 
  134 | // ─── Suite ────────────────────────────────────────────────────────────────────
  135 | 
  136 | test.describe('Admin Dashboard — Task CRUD', () => {
  137 |   let store: MockStore;
  138 | 
  139 |   test.beforeEach(async ({ page }) => {
  140 |     store = { tasks: structuredClone(MOCK_TASKS) };
  141 | 
  142 |     await injectSession(page);
  143 |     await registerTaskRoutes(page, store);
  144 | 
  145 |     await page.goto('/admin');
  146 |     await goToTasksSection(page);
  147 |   });
  148 | 
> 149 |   test.afterAll(async ({ browser }) => {
      |        ^ "afterAll" hook timeout of 30000ms exceeded.
  150 |     // Verify a fresh context with admin session still hits /admin (not redirected).
  151 |     const ctx = await browser.newContext();
  152 |     const p = await ctx.newPage();
  153 |     await p.addInitScript(
  154 |       ({ key, value }: { key: string; value: unknown }) => localStorage.setItem(key, JSON.stringify(value)),
  155 |       { key: STORAGE_KEY, value: TEST_ADMIN },
  156 |     );
  157 |     await p.route(API_TASKS, (r) => r.fulfill({ status: 200, body: '[]' }));
  158 |     await p.route(API_AI_INSIGHTS, (r) => r.fulfill({ status: 200, body: '{}' }));
  159 |     await p.goto('/admin');
  160 |     await expect(p).toHaveURL(/\/admin/);
  161 |     await ctx.close();
  162 |   });
  163 | 
  164 |   // ── Create a single task ──────────────────────────────────────────────────
  165 | 
  166 |   test('creates a task via TaskComposer and it appears in the table', { tag: '@smoke' }, async ({ page }) => {
  167 |     const composer = page.locator('section[aria-label="Crear tarea"]');
  168 |     await expect(composer).toBeVisible();
  169 | 
  170 |     await composer.locator('#tituloInput').fill('Setup CI pipeline');
  171 |     await composer.getByRole('button', { name: /AGREGAR TAREA/i }).click();
  172 | 
  173 |     // Auto-retrying assertion waits until the task row is rendered.
  174 |     await expect(page.getByRole('button', { name: 'Setup CI pipeline' })).toBeVisible();
  175 | 
  176 |     // Soft: row count increased by 1.
  177 |     await expect.soft(page.locator('table.tasks-table tbody tr')).toHaveCount(MOCK_TASKS.length + 1);
  178 |   });
  179 | 
  180 |   // ── Parameterized: one isolated test per task definition ─────────────────
  181 |   // The for-loop runs at collection time (before any test executes), producing
  182 |   // three separate test entries.  Each test gets its own fresh beforeEach/afterAll
  183 |   // cycle and a clean mock store — mutations from one test never bleed into another.
  184 | 
  185 |   for (const { title, hours, priority } of PARAMETERIZED_TASKS) {
  186 |     test(
  187 |       `[parameterized] creates "${title}" with priority=${priority}`,
  188 |       { tag: '@parameterized' },
  189 |       async ({ page }) => {
  190 |         const composer = page.locator('section[aria-label="Crear tarea"]');
  191 |         await expect(composer).toBeVisible();
  192 | 
  193 |         // Fill fields — the POST /todolist route is already wired by beforeEach.
  194 |         await composer.locator('#tituloInput').fill(title);
  195 |         await composer.locator('#horasInput').fill(hours);
  196 |         await composer.locator('#prioridadInput').selectOption(priority);
  197 |         await composer.getByRole('button', { name: /AGREGAR TAREA/i }).click();
  198 | 
  199 |         // Auto-retrying: waits until the new row renders.
  200 |         await expect(page.getByRole('button', { name: title })).toBeVisible();
  201 | 
  202 |         // Soft: row count rises from seed (3) to seed+1.
  203 |         await expect.soft(page.locator('table.tasks-table tbody tr')).toHaveCount(MOCK_TASKS.length + 1);
  204 |         // Soft: at least one priority badge in the table shows the chosen value.
  205 |         // getByText(priority) matches hidden <option> elements first; scope to
  206 |         // the badge span so we only target visible PriorityBadge components.
  207 |         await expect.soft(page.locator('span.badge.priority', { hasText: priority }).first()).toBeVisible();
  208 |       },
  209 |     );
  210 |   }
  211 | 
  212 |   // ── Edit task fields ──────────────────────────────────────────────────────
  213 | 
  214 |   test('edits task fields via TaskEditModal', async ({ page }) => {
  215 |     // Click "Editar" on the first task row.
  216 |     const firstRow = page.locator('table.tasks-table tbody tr').first();
  217 |     await firstRow.getByRole('button', { name: 'Editar' }).click();
  218 | 
  219 |     // The edit modal must appear.
  220 |     const modal = page.getByRole('dialog');
  221 |     await expect(modal).toBeVisible();
  222 |     await expect(modal.getByText('Editar tarea')).toBeVisible();
  223 | 
  224 |     // Update the title field.
  225 |     await modal.locator('#editTitle').fill('Implement login feature (updated)');
  226 | 
  227 |     // Change priority to 'baja'.
  228 |     await modal.locator('#editPriority').selectOption('baja');
  229 | 
  230 |     // Soft: description textarea should be present.
  231 |     await expect.soft(modal.locator('#editDescription')).toBeVisible();
  232 | 
  233 |     await modal.getByRole('button', { name: 'Guardar cambios' }).click();
  234 | 
  235 |     // Modal closes and the updated title appears in the table.
  236 |     await expect(modal).not.toBeVisible();
  237 |     await expect(
  238 |       page.getByRole('button', { name: 'Implement login feature (updated)' }),
  239 |     ).toBeVisible();
  240 |   });
  241 | 
  242 |   // ── Mark complete ─────────────────────────────────────────────────────────
  243 | 
  244 |   test('marks a pending task complete and verifies status change', async ({ page }) => {
  245 |     const pendingRow = page.locator('table.tasks-table tbody tr').first();
  246 | 
  247 |     await pendingRow.getByRole('button', { name: 'Completar' }).click();
  248 | 
  249 |     // Hours modal.
```