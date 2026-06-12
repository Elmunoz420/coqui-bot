/**
 * auth.spec.ts — Authentication flow
 *
 * Covers: wrong-credential error, successful login (developer + admin),
 * localStorage persistence, and login↔register mode toggle.
 * All network calls are mocked — the real backend is never reached.
 */

import path from 'path';
import { test, expect } from '@playwright/test';
import {
  TEST_DEV,
  TEST_ADMIN,
  STORAGE_KEY,
  API_AUTH_LOGIN,
  API_TASKS,
  API_AI_INSIGHTS,
} from './helpers/types';

// ─── Shared mock helpers ───────────────────────────────────────────────────────

/** Silences the AI-insights call that AdminDashboard makes on mount. */
async function silenceAI(page: Parameters<typeof test>[1] extends never ? never : any) {
  await page.route(API_AI_INSIGHTS, (route: any) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

/** Returns an empty task list so dashboards don't block on load. */
async function mockEmptyTasks(page: any) {
  await page.route(API_TASKS, (route: any) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
}

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start every test from a clean, unauthenticated state.
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
  });

  test.afterAll(async ({ browser }) => {
    // Confirm that a brand-new context always lands on /login.
    const context = await browser.newContext();
    const freshPage = await context.newPage();
    await freshPage.route(API_TASKS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await freshPage.goto('/');
    await expect(freshPage).toHaveURL(/\/login/);
    await context.close();
  });

  // ── Wrong credentials ─────────────────────────────────────────────────────

  test('shows inline error on wrong credentials then succeeds with correct ones', { tag: '@smoke' }, async ({ page }) => {
    // Phase 1: reject the first attempt
    let callCount = 0;
    await page.route(API_AUTH_LOGIN, async (route) => {
      callCount += 1;
      if (callCount === 1) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Credenciales inválidas' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(TEST_DEV),
        });
      }
    });
    await mockEmptyTasks(page);

    await page.locator('input[name="username"]').fill('wrong_user');
    await page.locator('input[name="password"]').fill('wrong_pass');
    await page.getByRole('button', { name: /Ingresar/i }).click();

    // Auto-retrying assertion — waits until the alert is rendered.
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Credenciales inválidas');

    // Soft assertions: form fields must still be in the DOM after the error.
    await expect.soft(page.locator('input[name="username"]')).toBeVisible();
    await expect.soft(page.locator('input[name="password"]')).toBeVisible();

    // Phase 2: correct credentials — error clears and redirect fires.
    await page.locator('input[name="username"]').fill('testdev');
    await page.locator('input[name="password"]').fill('correct_pass');
    await page.getByRole('button', { name: /Ingresar/i }).click();

    await page.waitForURL('**/me');
    await expect(page).toHaveURL(/\/me$/);
    await expect(page.getByRole('alert')).not.toBeVisible();
  });

  // ── Developer redirect ────────────────────────────────────────────────────

  test('redirects developer to /me after login', async ({ page }) => {
    await page.route(API_AUTH_LOGIN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_DEV) }),
    );
    await mockEmptyTasks(page);

    await page.locator('input[name="username"]').fill(TEST_DEV.username);
    await page.locator('input[name="password"]').fill('any_password');
    await page.getByRole('button', { name: /Ingresar/i }).click();

    await page.waitForURL('**/me');
    await expect(page).toHaveURL(/\/me$/);

    // Soft: sidebar shows the user's name.
    await expect.soft(page.getByText(TEST_DEV.name)).toBeVisible();
  });

  // ── Admin redirect ────────────────────────────────────────────────────────

  test('redirects admin to /admin after login', async ({ page }) => {
    await page.route(API_AUTH_LOGIN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_ADMIN) }),
    );
    await mockEmptyTasks(page);
    await silenceAI(page);

    await page.locator('input[name="username"]').fill(TEST_ADMIN.username);
    await page.locator('input[name="password"]').fill('admin_pass');
    await page.getByRole('button', { name: /Ingresar/i }).click();

    await page.waitForURL('**/admin');
    await expect(page).toHaveURL(/\/admin$/);

    // exact:true prevents matching <h1>¡Bienvenido, Test Admin!</h1> as well as
    // the sidebar <strong>Test Admin</strong> — without it, strict mode fires.
    await expect.soft(page.getByText(TEST_ADMIN.name, { exact: true })).toBeVisible();
  });

  // ── localStorage persistence (annotated as slow) ──────────────────────────

  // @annotation: test.slow() — verifies an async side-effect (localStorage write)
  // which may take a render cycle longer on CI runners.
  test.slow('persists session to localStorage after successful login', async ({ page }) => {
    await page.route(API_AUTH_LOGIN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_DEV) }),
    );
    await mockEmptyTasks(page);

    await page.locator('input[name="username"]').fill(TEST_DEV.username);
    await page.locator('input[name="password"]').fill('password');
    await page.getByRole('button', { name: /Ingresar/i }).click();

    await page.waitForURL('**/me');

    const raw = await page.evaluate((key: string) => localStorage.getItem(key), STORAGE_KEY);
    const session = JSON.parse(raw!);

    expect(session.username).toBe(TEST_DEV.username);
    expect(session.role).toBe('developer');
    // Soft assertions on optional fields.
    expect.soft(session.name).toBe(TEST_DEV.name);
    expect.soft(session.id).toBe(TEST_DEV.id);
  });

  // ── Mode toggle ───────────────────────────────────────────────────────────

  test('toggles between login and register modes', async ({ page }) => {
    // Default: login mode.
    await expect(page.getByRole('heading', { name: /Iniciar sesión/i })).toBeVisible();
    // The "name" field only shows in register mode.
    await expect.soft(page.locator('input[name="name"]')).not.toBeVisible();

    await page.getByRole('button', { name: /Crear cuenta/i }).click();

    await expect(page.getByRole('heading', { name: /Crear cuenta/i })).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    // Role selector is also register-only.
    await expect.soft(page.locator('select[name="role"]')).toBeVisible();

    await page.getByRole('button', { name: /Ya tengo cuenta/i }).click();
    await expect(page.getByRole('heading', { name: /Iniciar sesión/i })).toBeVisible();
    await expect(page.locator('input[name="name"]')).not.toBeVisible();
  });

  // ── test.fail: access-control guard ──────────────────────────────────────

  // @annotation: test.fail() — documents a known behavioral guard at the route level.
  // A developer session navigating directly to /admin is redirected by ProtectedRoute.
  // The assertion `toHaveURL(/\/admin$/)` is EXPECTED to fail (developer lands on /me).
  // test.fail() inverts the outcome: the test PASSES precisely because the assertion fails.
  test.fail('developer session is blocked from /admin and redirected to /me', async ({ page }) => {
    // Network-level mock: inject developer session via localStorage init-script
    // so the auth context loads without touching the real /auth/login endpoint.
    await page.addInitScript(
      ({ key, value }: { key: string; value: unknown }) => {
        localStorage.setItem(key, JSON.stringify(value));
      },
      { key: STORAGE_KEY, value: TEST_DEV },
    );
    // Intercept at the network level — no real backend call is made.
    await page.route(API_TASKS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.goto('/admin');
    // ProtectedRoute redirects the developer to /me, so this assertion FAILS,
    // which is the expected outcome when test.fail() is in effect.
    await expect(page).toHaveURL(/\/admin$/);
  });

  // ── HAR mock: login ───────────────────────────────────────────────────────

  // @annotation: @har — demonstrates page.routeFromHAR() for network-level replay.
  // The HAR file at e2e/fixtures/login.har contains a pre-recorded POST /auth/login
  // response.  Playwright intercepts the request and serves the stored response
  // without ever reaching the real backend.
  test('logs in using HAR-mocked /auth/login response', { tag: '@har' }, async ({ page }) => {
    // Serve POST /auth/login from the HAR file.
    // notFound: 'fallthrough' passes any unmatched URL (e.g. /todolist) to the
    // next handler registered below, so only the login call is HAR-sourced.
    await page.routeFromHAR(
      path.join(__dirname, 'fixtures/login.har'),
      {
        url: '**/auth/login',
        notFound: 'fallthrough',
      },
    );

    // Mock the task-list endpoint that the dashboard fetches after login.
    await page.route(API_TASKS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );

    // Navigate to root — no session present, so ProtectedRoute lands on /login.
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);

    // Fill credentials matching the HAR entry (HAR matches on URL+method, not body).
    await page.locator('input[name="username"]').fill(TEST_DEV.username);
    await page.locator('input[name="password"]').fill('any_password');
    await page.getByRole('button', { name: /Ingresar/i }).click();

    // HAR fulfills the 200 → AuthContext stores the session → redirects to /me.
    await page.waitForURL('**/me');
    await expect(page).toHaveURL(/\/me$/);
  });
});
