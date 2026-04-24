import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import KPIDashboard from './Kpidashboard';

describe('KPIDashboard.team-kpis', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('loads team KPI data from /todolist and renders sprint totals and logged hours', async () => {
    if (!global.fetch) {
      global.fetch = jest.fn();
    }
    // El dataset mezcla sprints, integrantes y tareas completadas/no completadas
    // para que el resumen tenga algo realista que calcular.
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: {
        get: () => 'application/json',
      },
      json: () => Promise.resolve([
        {
          id: 701,
          description: 'Terminar pruebas Sprint 1',
          descripcion: 'Sprint 1 cierre QA',
          done: true,
          horasReales: 5,
          assignedUser: 'Fernanda',
          sprint: 'Sprint 1',
        },
        {
          id: 702,
          description: 'Ajustar backend Sprint 1',
          descripcion: 'Sprint 1 ajustes',
          done: true,
          horasReales: 3,
          assignedUser: 'Esteban',
          sprint: 'Sprint 1',
        },
        {
          id: 703,
          description: 'Preparar deploy Sprint 2',
          descripcion: 'Sprint 2 despliegue',
          done: true,
          horasReales: 4,
          assignedUser: 'Fernanda',
          sprint: 'Sprint 2',
        },
        {
          id: 704,
          description: 'Documentar demo Sprint 2',
          descripcion: 'Sprint 2 docs',
          done: false,
          horasReales: 2,
          assignedUser: 'Juan Pablo',
          sprint: 'Sprint 2',
        },
      ]),
    });

    render(<KPIDashboard />);

    // Esperamos el resumen superior porque depende de que termine el fetch y el cálculo de KPIs.
    await waitFor(() => {
      expect(screen.getByText(/4 tasks total/i)).toBeTruthy();
    });

    // Validamos tanto la llamada HTTP como los textos que el usuario realmente ve en pantalla.
    expect(fetchSpy).toHaveBeenCalledWith('/todolist');
    expect(screen.getByText('Tareas Completadas por Sprint')).toBeTruthy();
    expect(screen.getByText('Horas Reales por Desarrollador (tendencia)')).toBeTruthy();

    const summary = screen.getByText(/4 tasks total/i).closest('p');
    const summaryView = within(summary.parentElement);
    expect(summaryView.getByText(/3 completed/i)).toBeTruthy();
    expect(summaryView.getByText(/14h logged/i)).toBeTruthy();
    expect(screen.getAllByText('Sprint 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fernanda').length).toBeGreaterThan(0);
  });
});
