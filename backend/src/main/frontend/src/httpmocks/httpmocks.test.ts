import { beforeEach, describe, expect, test } from 'vitest';
import { resetFakeTasks } from './handler';

const apiUrl = (path: string) => `http://localhost${path}`;

describe('MSW task API mocks', () => {
  beforeEach(() => {
    resetFakeTasks();
  });

  test('crear tarea', async () => {
    const payload = {
      description: 'Crear evidencia con MSW',
      descripcion: 'Mock HTTP sin backend real',
      prioridad: 'alta',
      sprint: 'Sprint 2',
      assignedUser: 'Fernanda',
      horasEstimadas: 4,
      taskId: 'S2-200',
    };

    await expect(
      fetch(apiUrl('/todolist'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((response) => response.json()),
    ).resolves.toEqual(expect.objectContaining({
      id: 200,
      description: 'Crear evidencia con MSW',
      descripcion: 'Mock HTTP sin backend real',
      prioridad: 'alta',
      estado: 'pendiente',
      done: false,
      sprint: 'Sprint 2',
      assignedUser: 'Fernanda',
      horasEstimadas: 4,
      taskId: 'S2-200',
    }));
  });

  test('obtener todas las tareas', async () => {
    await expect(
      fetch(apiUrl('/todolist')).then((response) => response.json()),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 101,
        description: 'Preparar demo final',
        estado: 'pendiente',
        done: false,
      }),
      expect.objectContaining({
        id: 102,
        description: 'Documentar evidencia de QA',
        estado: 'completada',
        done: true,
      }),
    ]);
  });

  test('obtener tareas completadas', async () => {
    await expect(
      fetch(apiUrl('/todolist/completed')).then((response) => response.json()),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 102,
        description: 'Documentar evidencia de QA',
        estado: 'completada',
        done: true,
        sprint: 'Sprint 1',
      }),
    ]);
  });

  test('marcar tarea como completada', async () => {
    await expect(
      fetch(apiUrl('/todolist/101'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Preparar demo final',
          done: true,
          horasReales: 3.5,
        }),
      }).then((response) => response.json()),
    ).resolves.toEqual(expect.objectContaining({
      id: 101,
      description: 'Preparar demo final',
      estado: 'completada',
      done: true,
      horasReales: 3.5,
    }));
  });

  test('devuelve 404 al marcar tarea inexistente', async () => {
    await expect(
      fetch(apiUrl('/todolist/999'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          done: true,
        }),
      }).then(async (response) => ({
        status: response.status,
        body: await response.json(),
      })),
    ).resolves.toEqual({
      status: 404,
      body: { message: 'Tarea no encontrada' },
    });
  });

  test('la tarea aparece en completadas despues de marcarla como completada', async () => {
    await fetch(apiUrl('/todolist/101'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Preparar demo final',
        done: true,
        horasReales: 3.5,
      }),
    });

    await expect(
      fetch(apiUrl('/todolist/completed')).then((response) => response.json()),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 101,
        description: 'Preparar demo final',
        estado: 'completada',
        done: true,
      }),
      expect.objectContaining({
        id: 102,
        description: 'Documentar evidencia de QA',
        estado: 'completada',
        done: true,
      }),
    ]);
  });
});
