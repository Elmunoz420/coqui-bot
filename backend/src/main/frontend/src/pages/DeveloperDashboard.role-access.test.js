import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeveloperDashboard from './DeveloperDashboard';
import useAuth from '../app/auth/useAuth';
import useTaskWorkspace from '../features/tasks/useTaskWorkspace';

jest.mock('../app/auth/useAuth');
jest.mock('../features/tasks/useTaskWorkspace', () => {
  const original = jest.requireActual('../features/tasks/useTaskWorkspace');
  return {
    __esModule: true,
    ...original,
    default: jest.fn(),
  };
});

describe('DeveloperDashboard.role-access', () => {
  test('shows the personalized developer workspace and hides admin-only sections', async () => {
    const logoutMock = jest.fn();

    // Sesión mock de developer: esta prueba valida el dashboard por rol.
    useAuth.mockReturnValue({
      user: {
        id: 'dev-1',
        username: 'fernanda',
        name: 'Fernanda Jimenez',
        role: 'developer',
      },
      logout: logoutMock,
    });

    // Mockeamos el hook para controlar exactamente qué tareas y actividad ve el usuario.
    useTaskWorkspace.mockReturnValue({
      isLoading: false,
      error: null,
      activityLog: [
        {
          id: 'activity-1',
          message: 'Tarea actualizada',
          taskId: 601,
          createdAt: '2026-04-21T12:00:00Z',
        },
      ],
      normalizedTasks: [
        {
          id: 601,
          title: 'Subir evidencias',
          sprint: 'Sprint 3',
          status: 'pendiente',
          done: false,
          assignedUser: 'Fernanda',
          dueDate: '2026-04-30T18:00:00Z',
          realHours: 2,
        },
      ],
      selectedTask: null,
      isTaskDetailOpen: false,
      openTaskDetails: jest.fn(),
      closeTaskDetails: jest.fn(),
    });

    render(<DeveloperDashboard />);

    // El developer debe ver su workspace, pero no elementos reservados para admin.
    expect(screen.getByText(/hola fernanda/i)).toBeTruthy();
    expect(screen.getAllByText('Developer Workspace').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mis tareas').length).toBeGreaterThan(0);
    expect(screen.queryByText('Panel global del proyecto')).toBeNull();
    expect(screen.queryByText('Indicadores KPI')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /salir/i }));
    // También cubrimos el handler de logout para usar explícitamente jest.fn().
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
