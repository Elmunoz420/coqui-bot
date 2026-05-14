import { http, HttpResponse } from 'msw';

type Task = {
  id: number;
  description: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  done: boolean;
  createdAt: string;
  fechaLimite: string | null;
  horasEstimadas: number;
  horasReales: number;
  assignedUser: string;
  sprint: string;
  taskId: string;
};

const initialTasks = (): Task[] => [
  {
    id: 101,
    description: 'Preparar demo final',
    descripcion: 'Ensayar flujo de pruebas automatizadas',
    prioridad: 'alta',
    estado: 'pendiente',
    done: false,
    createdAt: '2026-05-13T12:00:00Z',
    fechaLimite: '2026-05-20T18:00:00Z',
    horasEstimadas: 3,
    horasReales: 0,
    assignedUser: 'Fernanda',
    sprint: 'Sprint 1',
    taskId: 'S1-101',
  },
  {
    id: 102,
    description: 'Documentar evidencia de QA',
    descripcion: 'Capturas y resultados para la presentacion',
    prioridad: 'media',
    estado: 'completada',
    done: true,
    createdAt: '2026-05-12T12:00:00Z',
    fechaLimite: '2026-05-14T18:00:00Z',
    horasEstimadas: 2,
    horasReales: 2.5,
    assignedUser: 'Esteban',
    sprint: 'Sprint 1',
    taskId: 'S1-102',
  },
];

let tasks = initialTasks();
let nextId = 200;

export function resetFakeTasks() {
  tasks = initialTasks();
  nextId = 200;
}

export const handler = [
  http.get('http://localhost/todolist', () => {
    return HttpResponse.json(tasks);
  }),

  http.get('http://localhost/todolist/completed', () => {
    return HttpResponse.json(tasks.filter((task) => task.done));
  }),

  http.post('http://localhost/todolist', async ({ request }) => {
    const body = await request.clone().json() as Partial<Task>;
    const id = nextId++;
    const createdTask: Task = {
      id,
      description: body.description || 'Sin titulo',
      descripcion: body.descripcion || '',
      prioridad: body.prioridad || 'media',
      estado: 'pendiente',
      done: false,
      createdAt: '2026-05-14T09:00:00Z',
      fechaLimite: body.fechaLimite || null,
      horasEstimadas: body.horasEstimadas || 0,
      horasReales: 0,
      assignedUser: body.assignedUser || 'Sin asignar',
      sprint: body.sprint || 'Sprint 1',
      taskId: body.taskId || `S1-${id}`,
    };

    tasks = [createdTask, ...tasks];

    return HttpResponse.json(createdTask, {
      status: 201,
      headers: {
        location: String(id),
      },
    });
  }),

  http.put('http://localhost/todolist/:id', async ({ params, request }) => {
    const id = Number(params.id);
    const body = await request.clone().json() as Partial<Task>;
    const existingTask = tasks.find((task) => task.id === id);

    if (!existingTask) {
      return HttpResponse.json({ message: 'Tarea no encontrada' }, { status: 404 });
    }

    const updatedTask: Task = {
      ...existingTask,
      ...body,
      id,
      estado: body.done ? 'completada' : 'pendiente',
      done: Boolean(body.done),
      horasReales: body.horasReales ?? existingTask.horasReales,
    };

    tasks = tasks.map((task) => (task.id === id ? updatedTask : task));

    return HttpResponse.json(updatedTask);
  }),
];
