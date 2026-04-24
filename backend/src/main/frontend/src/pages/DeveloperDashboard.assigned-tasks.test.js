import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DeveloperDashboard from './DeveloperDashboard';
import useAuth from '../app/auth/useAuth';

jest.mock('../app/auth/useAuth');

describe('DeveloperDashboard.assigned-tasks', () => {
  beforeEach(() => {
    // Dejamos fija una sesión de developer para que el dashboard filtre con ese username.
    useAuth.mockReturnValue({
      user: {
        id: 'dev-1',
        username: 'fernanda',
        name: 'Fernanda Jimenez',
        role: 'developer',
      },
      logout: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('loads /todolist/my and shows only the tasks assigned to the logged-in developer', async () => {
    if (!global.fetch) {
      global.fetch = jest.fn();
    }
    // El mock trae 2 tasks para verificar el filtro.
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        {
          id: 201,
          description: 'Corregir login',
          descripcion: 'Ajustar validaciones del formulario',
          prioridad: 'alta',
          estado: 'pendiente',
          done: false,
          createdAt: '2026-04-20T08:00:00Z',
          fechaLimite: '2026-04-27T18:00:00Z',
          horasEstimadas: 5,
          horasReales: 0,
          assignedUser: 'Fernanda',
          sprint: 'Sprint 2',
        },
        {
          id: 202,
          description: 'Refactor backend',
          descripcion: 'Optimizar endpoints de tareas',
          prioridad: 'media',
          estado: 'pendiente',
          done: false,
          createdAt: '2026-04-20T08:00:00Z',
          fechaLimite: '2026-04-29T18:00:00Z',
          horasEstimadas: 6,
          horasReales: 0,
          assignedUser: 'Esteban',
          sprint: 'Sprint 2',
        },
      ]),
    });

    render(<DeveloperDashboard />);

    // Esperamos a que la UI termine de pintar las tareas cargadas por fetch.
    await waitFor(() => {
      expect(screen.getAllByText('Corregir login').length).toBeGreaterThan(0);
    });

    // Debe consultar el endpoint específico del usuario y no mostrar tareas ajenas.
    expect(fetchSpy).toHaveBeenCalledWith('/todolist/my?username=fernanda');
    expect(screen.queryByText('Refactor backend')).toBeNull();
  });
});
