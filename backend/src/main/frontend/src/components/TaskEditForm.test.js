import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import TaskDetailDrawer from './TaskDetailDrawer';

jest.mock('@mui/material', () => ({
  Drawer: ({ open, children }) => (open ? <div>{children}</div> : null),
}));

describe('TaskEditForm', () => {
  test('allows editing task fields and saving them', async () => {
    let resolveSave;
    const onSaveTask = jest.fn(() => new Promise((resolve) => {
      resolveSave = resolve;
    }));

    // Mockeamos el drawer de MUI y controlamos async
    // para comprobar tanto el payload enviado como el cierre del modo edición.
    render(
      <TaskDetailDrawer
        open
        onClose={jest.fn()}
        canEdit
        onSaveTask={onSaveTask}
        developerOptions={['Juan Pablo', 'Fernanda']}
        task={{
          id: 7,
          title: 'Crear login',
          description: 'Pantalla de acceso para el portal',
          status: 'pending',
          done: false,
          priority: 'alta',
          assignedUser: 'Juan Pablo',
          project: 'COQUI BOT',
          dueDate: '2026-04-30T12:00:00.000Z',
          createdAt: '2026-04-22T10:00:00.000Z',
          estimatedHours: 5,
          realHours: 0,
          history: [],
          aiSuggestions: [],
        }}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /editar/i }));

    const titleInput = screen.getByLabelText(/task name/i);
    const developerInput = screen.getByLabelText(/developer name/i);
    const hoursInput = screen.getByLabelText(/estimated hours/i);

    // Este flujo representa el cambio de datos que pide el assignment.
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Crear login con validaciones');
    await userEvent.selectOptions(developerInput, 'Fernanda');
    await userEvent.clear(hoursInput);
    await userEvent.type(hoursInput, '8');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(onSaveTask).toHaveBeenCalledWith(7, {
        title: 'Crear login con validaciones',
        assignedUser: 'Fernanda',
        estimatedHours: '8',
      });
    });

    await act(async () => {
      resolveSave();
    });

    // Si el guardado termina, el formulario deja de mostrarse.
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /guardar/i })).toBeNull();
    });
  });
});
