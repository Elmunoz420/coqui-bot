import React from 'react';
import { render, screen, within } from '@testing-library/react';
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

describe('DeveloperMetrics.personal-kpis', () => {
  test('renders personal completed-task and logged-hours metrics for the developer', async () => {
    // La sesión debe corresponder al developer cuyas métricas queremos revisar.
    useAuth.mockReturnValue({
      user: {
        id: 'dev-1',
        username: 'fernanda',
        name: 'Fernanda Jimenez',
        role: 'developer',
      },
      logout: jest.fn(),
    });

    // El set de datos está pensado para que el progreso no sea trivial:
    // 3 tareas en total, 2 completadas y 8 horas acumuladas.
    useTaskWorkspace.mockReturnValue({
      isLoading: false,
      error: null,
      activityLog: [],
      normalizedTasks: [
        {
          id: 801,
          title: 'Diseñar landing',
          sprint: 'Sprint 2',
          status: 'completada',
          done: true,
          assignedUser: 'Fernanda',
          dueDate: '2026-04-28T18:00:00Z',
          realHours: 6,
        },
        {
          id: 802,
          title: 'Ajustar drawer',
          sprint: 'Sprint 2',
          status: 'pendiente',
          done: false,
          assignedUser: 'Fernanda',
          dueDate: '2026-04-30T18:00:00Z',
          realHours: 0,
        },
        {
          id: 803,
          title: 'Preparar reporte',
          sprint: 'Sprint 2',
          status: 'completada',
          done: true,
          assignedUser: 'Fernanda',
          dueDate: '2026-05-02T18:00:00Z',
          realHours: 2,
        },
      ],
      selectedTask: null,
      isTaskDetailOpen: false,
      openTaskDetails: jest.fn(),
      closeTaskDetails: jest.fn(),
    });

    render(<DeveloperDashboard />);

    // Primero revisamos el resumen general visible en la parte superior.
    const summary = screen.getByLabelText('Resumen de tareas');
    const summaryView = within(summary);
    expect(summaryView.getByText('Mis tareas')).toBeTruthy();
    expect(summaryView.getByText('3')).toBeTruthy();
    expect(summaryView.getByText('Completadas')).toBeTruthy();
    expect(summaryView.getByText('2')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: /reportes/i }));

    // Después navegamos a reportes para validar las métricas personales ya agregadas.
    const reportsSection = screen.getByText('Métricas personales').closest('section');
    const reportsView = within(reportsSection);
    expect(reportsView.getByText('Horas registradas')).toBeTruthy();
    expect(reportsView.getByText('8h')).toBeTruthy();
    expect(reportsView.getByText('Progreso sprint')).toBeTruthy();
    expect(reportsView.getByText('67%')).toBeTruthy();
  });
});
