# Frontend Testing Blueprint

This document is a reusable blueprint for planning and implementing frontend tests in a React project using `Vitest`, `React Testing Library`, `@testing-library/user-event`, mock functions, mock modules, and snapshots.

Use it as a guide for another project where you need to cover the happy customer journey and the class topics.

## 1. Main goal

Design tests that validate user-visible behavior, not implementation details.

Prioritize:

- what the user sees
- what the user can click, type, or change
- what data appears after an action
- what happens when the app receives new data

Avoid:

- testing internal state directly
- testing private functions through the UI
- asserting exact hook calls unless that is the public contract
- overusing `data-testid` when accessible queries exist

## 2. Suggested testing layers

Think of the test strategy in layers:

### Layer 1: Unit tests

Best for:

- KPI calculators
- sprint aggregators
- role/permission helpers
- task mappers and formatters
- filters and sorting functions

Goal:

- validate pure logic quickly
- cover edge cases cheaply

Examples:

- calculate total hours worked by team in a sprint
- count tasks completed by one developer
- decide whether a worker can see admin widgets

### Layer 2: Component tests

Best for:

- `TaskCard`
- `TaskList`
- `CompletedTasksList`
- `KpiWidget`
- `DashboardHeader`

Goal:

- verify what is rendered
- verify interactions on one component
- verify props -> UI output

Examples:

- a task card shows task name, developer, estimated hours, actual hours
- a completed badge appears after status changes
- a KPI widget renders the correct value and label

### Layer 3: Integration / feature tests

Best for:

- dashboard screens
- task board flows
- role-based dashboard behavior
- real-time updates from API, polling, or websocket events

Goal:

- test multiple pieces working together
- mock network/services, but keep the UI real
- cover the happy path end-to-end inside the frontend

Examples:

- user opens dashboard and sees assigned tasks in real time
- manager clicks sprint filter and team KPIs update
- developer marks a task as completed and the completed list updates

### Layer 4: Snapshot tests

Use snapshots carefully, only for stable UI output.

Good snapshot targets:

- small presentational components
- empty states
- loading states
- simple KPI cards

Do not use snapshots as the main proof of behavior.

Snapshots complement assertions, they do not replace them.

### Layer 5: Optional E2E tests

If your other project uses Playwright or Cypress, keep only a few high-value flows:

- login -> dashboard -> view tasks
- update task -> save -> UI updates
- mark task completed -> completed list updates

For your class grading, frontend integration tests with mocked services are usually the main focus.

## 3. Recommended coverage by requirement

Below is a practical mapping from requirement to test layers.

### A. Real-time display of tasks assigned to each user

Recommended layers:

- integration test
- component test for task list
- optional unit test for task-to-user filter helper

What to validate:

- the correct tasks appear for the current user
- when new task data arrives, the list updates
- tasks assigned to other users are not shown in the wrong dashboard

Suggested technique:

- mock the realtime service or API polling module
- use `vi.mock()` for the module
- trigger a fake event or return updated mocked data

Example assertions:

- `screen.getByText('Task A')`
- `expect(screen.queryByText('Task for other user')).not.toBeInTheDocument()`
- after update, `expect(screen.getByText('New assigned task')).toBeInTheDocument()`

### B. State changes for task data

Fields:

- task name
- developer name
- story points
- estimated hours

Recommended layers:

- component test for edit form
- integration test for save flow
- unit test for any data transformation helper

What to validate:

- form starts with current values
- user edits fields
- save action sends correct data
- updated values appear in the UI

Suggested technique:

- use `userEvent.clear()` and `userEvent.type()`
- mock save API with `vi.fn()`
- assert visible result after save

### C. List of tasks completed per sprint

Minimum ticket info required:

- Task Name
- Developer Name
- Estimated Hours
- Actual Hours

Recommended layers:

- component test for completed tasks list
- integration test for sprint filter + rendered results

What to validate:

- only completed tasks for the selected sprint are shown
- each item contains the minimum required fields
- empty state appears when no tasks are completed

### D. Ability to mark a task as completed

Recommended layers:

- component test for button or checkbox interaction
- integration test for full flow

What to validate:

- user clicks "Complete" or checks a box
- task status changes visually
- task moves to completed section if your UI works that way
- persistence function/API is called with correct payload

Suggested technique:

- `vi.fn()` for submit/update handler
- `userEvent.click()`
- assert both behavior and visible UI change

### E. Customized dashboard based on worker role

Recommended layers:

- integration test
- unit test for role permission helpers
- optional snapshot for stable dashboard variants

What to validate:

- developer sees only developer widgets
- scrum master or manager sees team KPIs and broader controls
- clicking dashboard buttons reveals the expected role-specific information

Suggested technique:

- render the page with different mocked authenticated users
- use a helper like `renderDashboard({ role: 'developer' })`

### F. KPIs: team hours worked and tasks completed by week/sprint

Recommended layers:

- unit tests for KPI calculators
- integration test for dashboard KPI widgets

What to validate:

- totals are correct for a selected week or sprint
- filters update numbers correctly
- dashboard labels remain clear and consistent

Examples:

- "Hours worked: 42"
- "Tasks completed: 8"

### G. KPIs: person hours worked and tasks completed by week/sprint

Recommended layers:

- unit tests for per-person aggregators
- integration tests for worker selector + KPI update

What to validate:

- selecting a worker updates KPIs
- calculations are correct per person
- period filter works with the selected worker

## 4. Topics from class and where to use them

### Mock functions: `vi.fn()`

Use for:

- API submit handlers
- callbacks like `onComplete`, `onSave`, `onFilterChange`
- analytics or notification calls

Example:

```ts
const onSave = vi.fn();
```

Useful assertions:

```ts
expect(onSave).toHaveBeenCalledTimes(1);
expect(onSave).toHaveBeenCalledWith(
  expect.objectContaining({
    taskName: 'Fix login bug',
    estimatedHours: 5,
  }),
);
```

### Spies: `vi.spyOn()`

Use for:

- service methods you want to observe
- utility functions whose output should still run or be temporarily replaced

Example:

```ts
const spy = vi.spyOn(taskService, 'updateTask');
```

### Mock modules: `vi.mock()`

Use for:

- API clients
- websocket/realtime modules
- auth/session providers
- router helpers if necessary

Example:

```ts
vi.mock('../services/tasksApi', () => ({
  fetchTasks: vi.fn(),
  updateTask: vi.fn(),
}));
```

### Snapshots

Use for:

- stable presentational components
- dashboard empty states
- completed ticket card layout

Example:

```tsx
const { container } = render(<CompletedTaskCard task={task} />);
expect(container.firstChild).toMatchSnapshot();
```

Always pair snapshots with at least one semantic assertion when behavior matters.

### React Testing Library

Prefer queries in this order:

1. `getByRole`
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByTestId` only if needed

Good:

```ts
screen.getByRole('button', { name: /complete task/i });
screen.getByRole('heading', { name: /team kpis/i });
screen.getByLabelText(/estimated hours/i);
```

### User Event

Prefer `userEvent` over `fireEvent` for realistic interactions:

- click
- type
- clear
- select options
- tab navigation

Example:

```ts
const user = userEvent.setup();
await user.type(screen.getByLabelText(/task name/i), 'Fix navbar');
await user.click(screen.getByRole('button', { name: /save/i }));
```

## 5. Folder blueprint

You can adapt a structure like this:

```text
src/
  components/
    TaskCard.tsx
    TaskCard.test.tsx
    CompletedTasksList.tsx
    CompletedTasksList.test.tsx
  pages/
    Dashboard.tsx
    Dashboard.test.tsx
  services/
    tasksApi.ts
  utils/
    kpi.ts
    kpi.test.ts
  test/
    setupTests.ts
    fixtures/
      tasks.ts
      users.ts
    renderWithProviders.tsx
```

## 6. Reusable test data strategy

Create fixtures instead of rebuilding data in every test.

Example:

```ts
export const taskFixture = {
  id: 'task-1',
  taskName: 'Build dashboard',
  developerName: 'Ana',
  storyPoints: 5,
  estimatedHours: 8,
  actualHours: 6,
  sprint: 'Sprint 4',
  status: 'in_progress',
};
```

Then override only what changes:

```ts
const completedTask = {
  ...taskFixture,
  status: 'completed',
  actualHours: 9,
};
```

## 7. Example test plan by feature

Use this section as a real template when you start your other project.

### Feature 1: Assigned tasks in real time

Minimum tests:

1. renders tasks assigned to the logged-in user
2. does not render tasks assigned to another user
3. updates the list when new realtime data arrives

Suggested layer:

- integration

### Feature 2: Editing task data

Minimum tests:

1. form shows current task values
2. user edits name, developer, story points, estimated hours
3. save sends updated payload
4. UI shows updated data after success

Suggested layers:

- component
- integration

### Feature 3: Completed tasks per sprint

Minimum tests:

1. selected sprint shows only completed tasks from that sprint
2. each ticket includes task name, developer, estimated hours, actual hours
3. empty state appears when no completed tasks exist

Suggested layers:

- component
- integration

### Feature 4: Mark task as completed

Minimum tests:

1. clicking complete updates visible status
2. completion callback/API is called correctly
3. task appears in completed list

Suggested layers:

- component
- integration

### Feature 5: Role-based dashboard

Minimum tests:

1. developer role sees personal workload widgets
2. manager role sees team-level widgets
3. clicking role-available controls shows the correct information

Suggested layers:

- integration
- snapshot for stable dashboard variants if useful

### Feature 6: Team KPIs

Minimum tests:

1. team hours are calculated correctly for the selected sprint
2. completed task count is correct for the selected sprint
3. changing sprint/week updates the KPI widgets

Suggested layers:

- unit
- integration

### Feature 7: Person KPIs

Minimum tests:

1. selected worker shows correct hours worked
2. selected worker shows correct completed task count
3. changing worker or sprint updates KPI values

Suggested layers:

- unit
- integration

## 8. Happy path journeys you should automate

These are high-value flows for grading:

### Journey A: Developer completes work

1. user enters dashboard
2. user sees assigned tasks
3. user opens a task
4. user edits task information
5. user marks task as completed
6. task appears in completed sprint list
7. personal KPIs update

### Journey B: Manager reviews sprint progress

1. manager enters dashboard
2. manager sees team KPIs
3. manager changes sprint/week filter
4. completed task list updates
5. team hours and completed tasks refresh

## 9. Example integration test skeleton

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Dashboard from '../pages/Dashboard';

vi.mock('../services/tasksApi', () => ({
  fetchTasks: vi.fn(),
  updateTask: vi.fn(),
}));

describe('Dashboard happy path', () => {
  test('developer can complete a task and see updated information', async () => {
    const user = userEvent.setup();

    render(<Dashboard />);

    expect(screen.getByText(/build dashboard/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /complete task/i }));

    expect(screen.getByText(/completed/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /completed tasks/i })).toBeInTheDocument();
  });
});
```

## 10. Example unit tests for KPI logic

```ts
import { describe, expect, test } from 'vitest';
import { getTeamHours, getTasksCompletedByPerson } from './kpi';

describe('kpi helpers', () => {
  test('calculates team hours for a sprint', () => {
    expect(getTeamHours(tasks, 'Sprint 4')).toBe(42);
  });

  test('calculates completed tasks for one person', () => {
    expect(getTasksCompletedByPerson(tasks, 'Ana', 'Sprint 4')).toBe(3);
  });
});
```

## 11. Example snapshot target

```tsx
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import EmptyCompletedTasksState from './EmptyCompletedTasksState';

describe('EmptyCompletedTasksState', () => {
  test('matches snapshot', () => {
    const { container } = render(<EmptyCompletedTasksState />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## 12. Anti-patterns to avoid

Avoid these because they usually reduce test quality:

- testing component internals instead of rendered behavior
- selecting everything with `data-testid`
- asserting exact state setter calls
- making one huge test for every feature
- snapshotting very large containers
- mocking too much of the UI
- not resetting mocks between tests

## 13. Practical checklist before writing each test

Ask yourself:

1. What requirement am I covering?
2. Which layer is best: unit, component, or integration?
3. What user behavior proves this works?
4. What should be mocked?
5. What visible assertion proves success?
6. Is this a happy path or an edge case?

## 14. Deliverable checklist for the graded project

Try to make sure your other project includes:

- at least one strong frontend test per required feature
- several integration tests for the happy journey
- unit tests for KPI calculations
- at least one use of `vi.fn()`
- at least one use of `vi.spyOn()`
- at least one mocked module with `vi.mock()`
- at least one well-chosen snapshot
- tests written with RTL queries that avoid implementation details
- realistic interactions with `userEvent`

## 15. Suggested implementation order

If you want to build the test suite in a clean order:

1. write fixtures
2. write render helpers
3. test KPI unit helpers
4. test small UI components
5. test completed-task flow
6. test role-based dashboard
7. test realtime updates
8. add one or two snapshots for stable presentational components

## 16. Reusable test case template

Copy and adapt this per feature:

```md
Feature:

User story:

Layer:

Mocks needed:

Happy path:
1.
2.
3.

Assertions:
- 
- 
- 

Optional edge cases:
- 
- 
```

## 17. Final recommendation

For grading, do not stop at exactly seven tests. Build a small but balanced suite:

- unit tests for calculations
- component tests for rendering and interactions
- integration tests for the main dashboard flows
- snapshots only where the UI is stable and simple

That combination shows technique variety and matches the topics covered in class.
