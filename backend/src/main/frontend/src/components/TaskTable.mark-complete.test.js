import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskTable from './TaskTable';

describe('TaskTable.mark-complete', () => {
  test('opens the completion modal and sends the selected task plus hours to the handler', async () => {
    // Este handler representa la acción que después terminaría actualizando el backend.
    const onCompleteTask = jest.fn();

    render(
      <TaskTable
        tasks={[
          {
            id: 401,
            taskId: 'S3-009',
            title: 'Preparar demo final',
            rawDescription: 'Preparar demo final',
            description: 'Ensayar la presentacion del sprint',
            sprint: 'Sprint 3',
            priority: 'media',
            status: 'pendiente',
            done: false,
            assignedUser: 'Fernanda',
            estimatedHours: 2,
            realHours: 0,
            dueDate: '2026-04-30T18:00:00Z',
          },
        ]}
        onToggleDone={onCompleteTask}
        onDelete={jest.fn()}
        onOpenDetails={jest.fn()}
      />
    );

    // El usuario abre el modal, captura las horas reales y confirma el cambio.
    await userEvent.click(screen.getByRole('button', { name: /completar/i }));
    await userEvent.type(screen.getByPlaceholderText(/ej. 2.5/i), '3.5');
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(onCompleteTask).toHaveBeenCalledTimes(1);
    // Además del id, nos interesa comprobar que el flujo manda la acción como "completada".
    expect(onCompleteTask.mock.calls[0][0]).toEqual(expect.objectContaining({
      preventDefault: expect.any(Function),
    }));
    expect(onCompleteTask.mock.calls[0][1]).toBe(401);
    expect(onCompleteTask.mock.calls[0][2]).toBe('Preparar demo final');
    expect(onCompleteTask.mock.calls[0][3]).toBe(true);
    expect(onCompleteTask.mock.calls[0][4]).toBe(3.5);
  });
});
