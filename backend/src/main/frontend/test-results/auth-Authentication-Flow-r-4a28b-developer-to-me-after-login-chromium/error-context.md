# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> redirects developer to /me after login
- Location: e2e\auth.spec.ts:104:7

# Error details

```
"afterAll" hook timeout of 30000ms exceeded.
```

# Test source

```ts
  1   | /**
  2   |  * auth.spec.ts — Authentication flow
  3   |  *
  4   |  * Covers: wrong-credential error, successful login (developer + admin),
  5   |  * localStorage persistence, and login↔register mode toggle.
  6   |  * All network calls are mocked — the real backend is never reached.
  7   |  */
  8   | 
  9   | import path from 'path';
  10  | import { test, expect } from '@playwright/test';
  11  | import {
  12  |   TEST_DEV,
  13  |   TEST_ADMIN,
  14  |   STORAGE_KEY,
  15  |   API_AUTH_LOGIN,
  16  |   API_TASKS,
  17  |   API_AI_INSIGHTS,
  18  | } from './helpers/types';
  19  | 
  20  | // ─── Shared mock helpers ───────────────────────────────────────────────────────
  21  | 
  22  | /** Silences the AI-insights call that AdminDashboard makes on mount. */
  23  | async function silenceAI(page: Parameters<typeof test>[1] extends never ? never : any) {
  24  |   await page.route(API_AI_INSIGHTS, (route: any) =>
  25  |     route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  26  |   );
  27  | }
  28  | 
  29  | /** Returns an empty task list so dashboards don't block on load. */
  30  | async function mockEmptyTasks(page: any) {
  31  |   await page.route(API_TASKS, (route: any) =>
  32  |     route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  33  |   );
  34  | }
  35  | 
  36  | // ─── Suite ────────────────────────────────────────────────────────────────────
  37  | 
  38  | test.describe('Authentication Flow', () => {
  39  |   test.beforeEach(async ({ page }) => {
  40  |     // Start every test from a clean, unauthenticated state.
  41  |     await page.goto('/login');
  42  |     await page.evaluate(() => localStorage.clear());
  43  |   });
  44  | 
> 45  |   test.afterAll(async ({ browser }) => {
      |        ^ "afterAll" hook timeout of 30000ms exceeded.
  46  |     // Confirm that a brand-new context always lands on /login.
  47  |     const context = await browser.newContext();
  48  |     const freshPage = await context.newPage();
  49  |     await freshPage.route(API_TASKS, (route) =>
  50  |       route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  51  |     );
  52  |     await freshPage.goto('/');
  53  |     await expect(freshPage).toHaveURL(/\/login/);
  54  |     await context.close();
  55  |   });
  56  | 
  57  |   // ── Wrong credentials ─────────────────────────────────────────────────────
  58  | 
  59  |   test('shows inline error on wrong credentials then succeeds with correct ones', { tag: '@smoke' }, async ({ page }) => {
  60  |     // Phase 1: reject the first attempt
  61  |     let callCount = 0;
  62  |     await page.route(API_AUTH_LOGIN, async (route) => {
  63  |       callCount += 1;
  64  |       if (callCount === 1) {
  65  |         await route.fulfill({
  66  |           status: 401,
  67  |           contentType: 'application/json',
  68  |           body: JSON.stringify({ message: 'Credenciales inválidas' }),
  69  |         });
  70  |       } else {
  71  |         await route.fulfill({
  72  |           status: 200,
  73  |           contentType: 'application/json',
  74  |           body: JSON.stringify(TEST_DEV),
  75  |         });
  76  |       }
  77  |     });
  78  |     await mockEmptyTasks(page);
  79  | 
  80  |     await page.locator('input[name="username"]').fill('wrong_user');
  81  |     await page.locator('input[name="password"]').fill('wrong_pass');
  82  |     await page.getByRole('button', { name: /Ingresar/i }).click();
  83  | 
  84  |     // Auto-retrying assertion — waits until the alert is rendered.
  85  |     await expect(page.getByRole('alert')).toBeVisible();
  86  |     await expect(page.getByRole('alert')).toContainText('Credenciales inválidas');
  87  | 
  88  |     // Soft assertions: form fields must still be in the DOM after the error.
  89  |     await expect.soft(page.locator('input[name="username"]')).toBeVisible();
  90  |     await expect.soft(page.locator('input[name="password"]')).toBeVisible();
  91  | 
  92  |     // Phase 2: correct credentials — error clears and redirect fires.
  93  |     await page.locator('input[name="username"]').fill('testdev');
  94  |     await page.locator('input[name="password"]').fill('correct_pass');
  95  |     await page.getByRole('button', { name: /Ingresar/i }).click();
  96  | 
  97  |     await page.waitForURL('**/me');
  98  |     await expect(page).toHaveURL(/\/me$/);
  99  |     await expect(page.getByRole('alert')).not.toBeVisible();
  100 |   });
  101 | 
  102 |   // ── Developer redirect ────────────────────────────────────────────────────
  103 | 
  104 |   test('redirects developer to /me after login', async ({ page }) => {
  105 |     await page.route(API_AUTH_LOGIN, (route) =>
  106 |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_DEV) }),
  107 |     );
  108 |     await mockEmptyTasks(page);
  109 | 
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
```