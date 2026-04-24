import React from 'react';
import { render, screen, within } from '@testing-library/react';
import TaskTable from './TaskTable';

describe('CompletedTasksBySprint', () => {
  test('shows the minimum required ticket data for completed tasks in a sprint', () => {
    // Usamos una sola tarea completada para revisar claramente los campos mínimos del ticket.
    render(
      <TaskTable
        tasks={[
          {
            id: 301,
            taskId: 'S2-011',
            title: 'Implementar login',
            description: 'Conectar vista de acceso',
            sprint: 'Sprint 2',
            priority: 'alta',
            status: 'completada',
            done: true,
            assignedUser: 'Fernanda',
            estimatedHours: 5,
            realHours: 6,
            dueDate: '2026-04-28T18:00:00Z',
          },
        ]}
        onToggleDone={jest.fn()}
        onDelete={jest.fn()}
        onOpenDetails={jest.fn()}
      />
    );

    expect(screen.getByRole('columnheader', { name: /tarea/i })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /asignado a/i })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /hrs. est./i })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /hrs. reales/i })).toBeTruthy();

    // within() ayuda a validar el contenido de la fila correcta sin depender de otras filas.
    const row = screen.getByRole('row', { name: /implementar login/i });
    const rowView = within(row);

    expect(rowView.getByText('Implementar login')).toBeTruthy();
    expect(rowView.getByText('Sprint 2')).toBeTruthy();
    expect(rowView.getByText('Fernanda')).toBeTruthy();
    expect(rowView.getByText('5h')).toBeTruthy();
    expect(rowView.getByText('6h')).toBeTruthy();
  });
});
