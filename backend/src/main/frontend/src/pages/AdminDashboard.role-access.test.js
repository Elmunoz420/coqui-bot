import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from './AdminDashboard';
import useAuth from '../app/auth/useAuth';
import useTaskWorkspace from '../features/tasks/useTaskWorkspace';

jest.mock('../app/auth/useAuth');
jest.mock('../features/tasks/useTaskWorkspace');
jest.mock('../components/Kpidashboard', () => () => <div>KPI Dashboard Mock</div>);
// El drawer se simplifica para enfocarnos en permisos y navegación, no en los detalles visuales de MUI.
jest.mock('../components/TaskDetailDrawer', () => ({ task, canEdit }) => (
  task ? (
    <div>
      <div>{task.title}</div>
      {canEdit && <button type="button">Editar</button>}
    </div>
  ) : null
));

describe('AdminDashboard.role-access', () => {
  test('shows the global admin view, exposes KPI navigation and allows editing from the task drawer', async () => {
    const logoutMock = jest.fn();

    // Simulamos una sesión admin, que es la que debe ver la vista global.
    useAuth.mockReturnValue({
      user: {
        id: 'admin-1',
        username: 'fernanda.admin',
        name: 'Fernanda Jimenez',
        role: 'admin',
      },
      logout: logoutMock,
    });

    // El hook se mockea porque aquí nos interesa validar permisos y contenido visible,
    // no volver a probar la lógica interna del workspace.
    useTaskWorkspace.mockReturnValue({
      isLoading: false,
      isInserting: false,
      filters: { idSearch: '' },
      error: null,
      metrics: { total: 6, active: 3, completed: 2, overdue: 1 },
      statusOptions: ['All', 'pendiente', 'completada'],
      priorityOptions: ['All', 'alta', 'media'],
      developerOptions: ['All', 'Fernanda', 'Esteban'],
      normalizedTasks: [
        {
          id: 501,
          title: 'Coordinar release',
          description: 'Checklist de entrega',
          sprint: 'Sprint 3',
          priority: 'alta',
          status: 'pendiente',
          done: false,
          assignedUser: 'Fernanda',
          estimatedHours: 4,
          realHours: 0,
          dueDate: '2026-05-02T18:00:00Z',
          createdAt: '2026-04-20T09:00:00Z',
          project: 'COQUI BOT',
          history: [],
          aiSuggestions: [],
        },
      ],
      filteredAndSortedTasks: [],
      selectedTask: {
        id: 501,
        title: 'Coordinar release',
        description: 'Checklist de entrega',
        sprint: 'Sprint 3',
        priority: 'alta',
        status: 'pendiente',
        done: false,
        assignedUser: 'Fernanda',
        estimatedHours: 4,
        realHours: 0,
        dueDate: '2026-05-02T18:00:00Z',
        createdAt: '2026-04-20T09:00:00Z',
        project: 'COQUI BOT',
        history: [],
        aiSuggestions: [],
      },
      isTaskDetailOpen: true,
      addItem: jest.fn(),
      deleteItem: jest.fn(),
      toggleDone: jest.fn(),
      updateTaskDetails: jest.fn(() => Promise.resolve()),
      handleFilterChange: jest.fn(),
      resetFilters: jest.fn(),
      openTaskDetails: jest.fn(),
      closeTaskDetails: jest.fn(),
    });

    render(<AdminDashboard />);

    // El admin debe ver métricas globales, acceso a KPI y el botón para editar tarea.
    expect(screen.getByText('Panel global del proyecto')).toBeTruthy();
    expect(screen.getAllByText('Equipos').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /editar/i })).toBeTruthy();

    await userEvent.click(screen.getAllByRole('button', { name: /indicadores kpi/i })[0]);
    expect(screen.getByText('KPI Dashboard Mock')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: /salir/i }));
    // Cerramos verificando una acción real del usuario: salir de la sesión.
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
