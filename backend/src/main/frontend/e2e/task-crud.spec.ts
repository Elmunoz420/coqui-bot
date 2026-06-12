/**
 * task-crud.spec.ts — Full task CRUD (Admin Dashboard)
 *
 * Covers: creating multiple tasks via TaskComposer, editing fields via the
 * TaskEditModal, changing status (complete / reopen), and deleting a task.
 * Navigates to the "Tareas" section of the Admin Dashboard.
 * All network calls are mocked — the real backend is never reached.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  TEST_ADMIN,
  MOCK_TASKS,
  STORAGE_KEY,
  API_TASKS,
  API_TASK_BY_ID,
  API_AI_INSIGHTS,
  type Task,
} from './helpers/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function injectSession(page: Page, user = TEST_ADMIN): Promise<void> {
  await page.addInitScript(
    ({ key, value }: { key: string; value: unknown }) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    { key: STORAGE_KEY, value: user },
  );
}

/** Navigate to the "Tareas" section in the admin sidebar and wait for the table. */
async function goToTasksSection(page: Page): Promise<void> {
  // The admin dashboard defaults to "overview"; click "Tareas" in the sidebar.
  await page.locator('nav.workspace-nav').getByRole('button', { name: 'Tareas' }).click();
  await page.waitForSelector('table.tasks-table');
}

// ─── In-memory mock store ─────────────────────────────────────────────────────
// Each test.beforeEach wires a fresh copy of MOCK_TASKS into the route handlers.

type MockStore = { tasks: Task[] };

/** Register all task API routes against a shared in-memory store. */
async function registerTaskRoutes(page: Page, store: MockStore): Promise<void> {
  // Collection endpoint: GET (list) and POST (create).
  await page.route(API_TASKS, async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(store.tasks),
      });
      return;
    }

    if (method === 'POST') {
      const body = route.request().postDataJSON() as Partial<Task>;
      const created: Task = {
        id: Date.now(),
        description: body.description ?? body.titulo ?? 'Nueva tarea',
        titulo: body.titulo ?? body.description,
        descripcion: body.descripcion ?? '',
        prioridad: body.prioridad ?? 'media',
        estado: 'pendiente',
        done: false,
        createdAt: new Date().toISOString(),
        fechaLimite: body.fechaLimite ?? null,
        horasEstimadas: body.horasEstimadas ?? 0,
        horasReales: 0,
        assignedUser: body.assignedUser ?? 'Sin asignar',
        sprint: body.sprint ?? null,
        taskId: body.taskId ?? null,
      };
      store.tasks = [created, ...store.tasks];
      await route.fulfill({
        status: 201,
        headers: { location: String(created.id) },
        body: '',
      });
      return;
    }

    await route.continue();
  });

  // Individual task endpoint: PUT (update) and DELETE.
  await page.route(API_TASK_BY_ID, async (route) => {
    const method = route.request().method();
    const url = route.request().url();
    const id = url.split('/todolist/')[1]?.split('?')[0];

    if (method === 'PUT') {
      const body = route.request().postDataJSON() as Partial<Task>;
      store.tasks = store.tasks.map((t) =>
        String(t.id) === id ? { ...t, ...body } : t,
      );
      const updated = store.tasks.find((t) => String(t.id) === id);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated ?? { id }),
      });
      return;
    }

    if (method === 'DELETE') {
      store.tasks = store.tasks.filter((t) => String(t.id) !== id);
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    await route.continue();
  });

  // Silence AI endpoints that AdminDashboard pings on mount.
  await page.route(API_AI_INSIGHTS, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

// ─── Parameterized task data ───────────────────────────────────────────────────
// Drives the for-loop below: each entry produces one fully independent test
// that shares the same beforeEach/afterAll lifecycle and route mocks.

const PARAMETERIZED_TASKS = [
  { title: 'Write E2E tests',           hours: '2',   priority: 'alta'  },
  { title: 'Update documentation',       hours: '1',   priority: 'media' },
  { title: 'Fix priority badge colours', hours: '0.5', priority: 'baja'  },
] as const;

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe('Admin Dashboard — Task CRUD', () => {
  let store: MockStore;

  test.beforeEach(async ({ page }) => {
    store = { tasks: structuredClone(MOCK_TASKS) };

    await injectSession(page);
    await registerTaskRoutes(page, store);

    await page.goto('/admin');
    await goToTasksSection(page);
  });

  test.afterAll(async ({ browser }) => {
    // Verify a fresh context with admin session still hits /admin (not redirected).
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.addInitScript(
      ({ key, value }: { key: string; value: unknown }) => localStorage.setItem(key, JSON.stringify(value)),
      { key: STORAGE_KEY, value: TEST_ADMIN },
    );
    await p.route(API_TASKS, (r) => r.fulfill({ status: 200, body: '[]' }));
    await p.route(API_AI_INSIGHTS, (r) => r.fulfill({ status: 200, body: '{}' }));
    await p.goto('/admin');
    await expect(p).toHaveURL(/\/admin/);
    await ctx.close();
  });

  // ── Create a single task ──────────────────────────────────────────────────

  test('creates a task via TaskComposer and it appears in the table', { tag: '@smoke' }, async ({ page }) => {
    const composer = page.locator('section[aria-label="Crear tarea"]');
    await expect(composer).toBeVisible();

    await composer.locator('#tituloInput').fill('Setup CI pipeline');
    await composer.getByRole('button', { name: /AGREGAR TAREA/i }).click();

    // Auto-retrying assertion waits until the task row is rendered.
    await expect(page.getByRole('button', { name: 'Setup CI pipeline' })).toBeVisible();

    // Soft: row count increased by 1.
    await expect.soft(page.locator('table.tasks-table tbody tr')).toHaveCount(MOCK_TASKS.length + 1);
  });

  // ── Parameterized: one isolated test per task definition ─────────────────
  // The for-loop runs at collection time (before any test executes), producing
  // three separate test entries.  Each test gets its own fresh beforeEach/afterAll
  // cycle and a clean mock store — mutations from one test never bleed into another.

  for (const { title, hours, priority } of PARAMETERIZED_TASKS) {
    test(
      `[parameterized] creates "${title}" with priority=${priority}`,
      { tag: '@parameterized' },
      async ({ page }) => {
        const composer = page.locator('section[aria-label="Crear tarea"]');
        await expect(composer).toBeVisible();

        // Fill fields — the POST /todolist route is already wired by beforeEach.
        await composer.locator('#tituloInput').fill(title);
        await composer.locator('#horasInput').fill(hours);
        await composer.locator('#prioridadInput').selectOption(priority);
        await composer.getByRole('button', { name: /AGREGAR TAREA/i }).click();

        // Auto-retrying: waits until the new row renders.
        await expect(page.getByRole('button', { name: title })).toBeVisible();

        // Soft: row count rises from seed (3) to seed+1.
        await expect.soft(page.locator('table.tasks-table tbody tr')).toHaveCount(MOCK_TASKS.length + 1);
        // Soft: at least one priority badge in the table shows the chosen value.
        // getByText(priority) matches hidden <option> elements first; scope to
        // the badge span so we only target visible PriorityBadge components.
        await expect.soft(page.locator('span.badge.priority', { hasText: priority }).first()).toBeVisible();
      },
    );
  }

  // ── Edit task fields ──────────────────────────────────────────────────────

  test('edits task fields via TaskEditModal', async ({ page }) => {
    // Click "Editar" on the first task row.
    const firstRow = page.locator('table.tasks-table tbody tr').first();
    await firstRow.getByRole('button', { name: 'Editar' }).click();

    // The edit modal must appear.
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Editar tarea')).toBeVisible();

    // Update the title field.
    await modal.locator('#editTitle').fill('Implement login feature (updated)');

    // Change priority to 'baja'.
    await modal.locator('#editPriority').selectOption('baja');

    // Soft: description textarea should be present.
    await expect.soft(modal.locator('#editDescription')).toBeVisible();

    await modal.getByRole('button', { name: 'Guardar cambios' }).click();

    // Modal closes and the updated title appears in the table.
    await expect(modal).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Implement login feature (updated)' }),
    ).toBeVisible();
  });

  // ── Mark complete ─────────────────────────────────────────────────────────

  test('marks a pending task complete and verifies status change', async ({ page }) => {
    const pendingRow = page.locator('table.tasks-table tbody tr').first();

    await pendingRow.getByRole('button', { name: 'Completar' }).click();

    // Hours modal.
    await expect(page.getByText('Marcar como completada')).toBeVisible();
    // Use the placeholder to target only the ModalHoras input — page has multiple
    // input[type="number"] elements (TaskComposer's horasInput is also in the DOM).
    await page.getByPlaceholder('Ej. 2.5').fill('2');
    await page.getByRole('button', { name: 'Confirmar' }).click();

    await expect(page.getByText('Marcar como completada')).not.toBeVisible();
    await expect(pendingRow.getByRole('button', { name: 'Reabrir' })).toBeVisible();

    // Soft: at least one "Reabrir" exists across the whole table now.
    await expect.soft(page.getByRole('button', { name: 'Reabrir' })).toHaveCount(2);
  });

  // ── Reopen a completed task ───────────────────────────────────────────────

  test('reopens a completed task (status back to pendiente)', async ({ page }) => {
    // Task 102 starts as done=true.
    const completedRow = page
      .locator('table.tasks-table tbody tr')
      .filter({ hasText: 'Write unit tests' });

    await expect(completedRow.getByRole('button', { name: 'Reabrir' })).toBeVisible();
    await completedRow.getByRole('button', { name: 'Reabrir' }).click();

    // Button flips back to "Completar".
    await expect(completedRow.getByRole('button', { name: 'Completar' })).toBeVisible();
    await expect.soft(completedRow.getByRole('button', { name: 'Reabrir' })).not.toBeVisible();
  });

  // ── Change status: in-progress via edit modal ─────────────────────────────

  // @annotation: test.slow() — saving and re-rendering the table can be sluggish
  // when the mock store has many tasks on slower CI runners.
  test.slow('changes task status through the edit modal', async ({ page }) => {
    // Open edit modal for the first task.
    const firstRow = page.locator('table.tasks-table tbody tr').first();
    await firstRow.getByRole('button', { name: 'Editar' }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Mark as done via the checkbox (if present) or via the done field.
    // The edit modal maps to the `done` boolean; set it and save.
    const doneCheckbox = modal.locator('input[type="checkbox"]').first();
    if (await doneCheckbox.isVisible()) {
      await doneCheckbox.check();
    }

    await modal.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(modal).not.toBeVisible();

    // Soft: the row should now show "Reabrir" after the edit if done was set.
    await expect.soft(firstRow.getByRole('button', { name: 'Reabrir' })).toBeVisible();
  });

  // ── Delete a task ─────────────────────────────────────────────────────────

  test('deletes a task from the table', async ({ page }) => {
    const initialCount = await page.locator('table.tasks-table tbody tr').count();

    const firstRow = page.locator('table.tasks-table tbody tr').first();
    const titleBeforeDelete = await firstRow
      .getByRole('button')
      .filter({ hasText: /^(?!Editar|Completar|Reabrir|Eliminar).+/ })
      .first()
      .textContent();

    await firstRow.getByRole('button', { name: 'Eliminar' }).click();

    // Row count decreases by one.
    await expect(page.locator('table.tasks-table tbody tr')).toHaveCount(initialCount - 1);

    // The deleted task's title button is gone.
    if (titleBeforeDelete) {
      await expect(
        page.getByRole('button', { name: titleBeforeDelete }),
      ).not.toBeVisible();
    }
  });
});
