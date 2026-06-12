/**
 * tasks.spec.ts — Task list view (Developer Dashboard / /me)
 *
 * Covers: tasks visible for the logged-in developer, status pills, section
 * navigation, and opening the task-detail drawer.
 * All network calls are mocked — the real backend is never reached.
 *
 * Key architecture note for /me:
 * - DeveloperDashboard fetches /todolist/my?username=<user>, NOT /todolist
 * - Tasks are rendered as .task-list-row <button> elements (no <table>)
 * - There are no Completar/Reabrir/Editar/Eliminar buttons on this page
 */

import { test, expect, type Page } from '@playwright/test';
import {
  TEST_DEV,
  MOCK_TASKS,
  STORAGE_KEY,
  API_AI_INSIGHTS,
} from './helpers/types';

// DeveloperDashboard fetches /todolist/my?username=<name>, not /todolist.
const API_DEV_TASKS = '**/todolist/my*';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function injectSession(page: Page, user = TEST_DEV): Promise<void> {
  await page.addInitScript(
    ({ key, value }: { key: string; value: unknown }) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    { key: STORAGE_KEY, value: user },
  );
}

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe('Developer Dashboard — Task List', () => {
  test.beforeEach(async ({ page }) => {
    // Fix the clock so deadline/created-at dates render deterministically in snapshots.
    await page.clock.setFixedTime(new Date('2026-06-10T12:00:00Z'));
    // Inject auth before any navigation.
    await injectSession(page);

    // DeveloperDashboard fetches /todolist/my?username=testdev.
    // The pattern **/todolist/my* matches that URL; **/todolist alone does not.
    await page.route(API_DEV_TASKS, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_TASKS),
        });
      } else {
        await route.continue();
      }
    });

    // Silence the AI-insights endpoint (/api/ai/insights/developer?username=...).
    await page.route(API_AI_INSIGHTS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );

    await page.goto('/me');
    // DeveloperDashboard renders tasks as .task-list-row buttons (NOT a table).
    await page.waitForSelector('.task-list-row');
  });

  test.afterAll(async ({ browser }) => {
    // Sanity-check: a context with no session must redirect to /login.
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.route(API_DEV_TASKS, (r) => r.fulfill({ status: 200, body: '[]' }));
    await p.goto('/me');
    await expect(p).toHaveURL(/\/login/);
    await ctx.close();
  });

  // ── Task list rendering ───────────────────────────────────────────────────────

  test('displays tasks assigned to the current user', { tag: '@smoke' }, async ({ page }) => {
    // filterTasksForUser keeps tasks whose assignedUser matches the logged-in user's
    // name or username.  TEST_DEV.name = 'Test Developer' matches tasks 101 and 102;
    // task 103 ('Juan Pablo') is filtered out.
    const rows = page.locator('.task-list-row');
    await expect(rows).toHaveCount(2);

    // Task titles appear in .task-list-title spans inside each row button.
    await expect(page.locator('.task-list-title', { hasText: 'Implement login feature' })).toBeVisible();
    await expect(page.locator('.task-list-title', { hasText: 'Write unit tests' })).toBeVisible();

    // Soft: sprint · taskId meta text is visible for each row.
    await expect.soft(page.locator('.task-list-meta', { hasText: 'S1-001' })).toBeVisible();
    await expect.soft(page.locator('.task-list-meta', { hasText: 'S1-002' })).toBeVisible();
    // Visual regression: run `npx playwright test --update-snapshots` once to create
    // the baseline, then uncomment the line below to lock the layout.
    // await expect(page.locator('article.dev-primary-panel')).toMatchSnapshot('dev-task-list.png');
  });

  // ── Status pills ──────────────────────────────────────────────────────────────

  test('shows correct status pill for each task state', async ({ page }) => {
    // task 101: estado='pendiente' → .task-pill.pendiente
    // task 102: estado='completada' → .task-pill.completada
    await expect(page.locator('.task-pill.pendiente').first()).toBeVisible();
    await expect(page.locator('.task-pill.completada').first()).toBeVisible();
  });

  // ── Section navigation ────────────────────────────────────────────────────────

  test('switches to Mis tareas section via the segmented control', async ({ page }) => {
    // The segmented control has a "Mis tareas" button that sets activeSection='tasks'.
    // This re-renders the same .task-list-row buttons inside section.panel-surface.
    await page.locator('div.segmented-control').getByRole('button', { name: 'Mis tareas' }).click();

    // Tasks section is now active; same list renders inside the panel.
    await expect(page.locator('section.panel-surface .task-list-row').first()).toBeVisible();
    await expect(page.locator('section.panel-surface .task-list-row')).toHaveCount(2);
  });

  // ── Task detail drawer ────────────────────────────────────────────────────────

  test('opens task detail drawer when clicking the task title', async ({ page }) => {
    // Clicking the .task-list-title span bubbles to the parent .task-list-row button,
    // which calls openTaskDetails(task) → opens the TaskDetailDrawer aside.
    await page.locator('.task-list-title', { hasText: 'Implement login feature' }).click();

    const drawer = page.locator('.task-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Implement login feature')).toBeVisible();

    // Soft: drawer renders the standard detail-panel labels.
    await expect.soft(drawer.getByText('Status')).toBeVisible();
    await expect.soft(drawer.getByText('Priority')).toBeVisible();
    await expect.soft(drawer.getByText('Assigned user')).toBeVisible();
  });

  // @annotation: test.skip — filter edge-case needs stabilisation on CI before enabling.
  test.skip('shows empty state when all tasks are filtered out', async () => {
    // TODO: interact with TaskFilters to pick an impossible combination, then
    // assert <div role="status"> with "No se encontraron tareas".
  });
});
