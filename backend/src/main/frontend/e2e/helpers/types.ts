// Shared interfaces, types, and test constants for Coqui Bot e2e tests.

export interface Task {
  id: number;
  taskId?: string | null;
  titulo?: string;
  description: string;
  descripcion?: string;
  prioridad: 'alta' | 'media' | 'baja';
  estado: 'pendiente' | 'completada' | 'cerrada' | 'en-progreso' | 'testing';
  done: boolean;
  createdAt: string;
  fechaLimite?: string | null;
  horasEstimadas?: number;
  horasReales?: number;
  assignedUser?: string | null;
  sprint?: string | number | null;
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'developer';
  status?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthErrorResponse {
  message: string;
}

// ─── localStorage keys ────────────────────────────────────────────────────────

export const STORAGE_KEY = 'coqui_session';
export const TASK_ID_STORAGE = 'coqui_task_ids';

// ─── API route constants ───────────────────────────────────────────────────────

export const API_TASKS = '**/todolist';
export const API_TASK_BY_ID = '**/todolist/*';
export const API_AUTH_LOGIN = '**/auth/login';
export const API_AUTH_REGISTER = '**/auth/register';
export const API_AI_INSIGHTS = '**/api/ai/**';

// ─── Test personas ─────────────────────────────────────────────────────────────

export const TEST_DEV: User = {
  id: 1,
  username: 'testdev',
  name: 'Test Developer',
  role: 'developer',
  status: 'active',
};

export const TEST_ADMIN: User = {
  id: 2,
  username: 'testadmin',
  name: 'Test Admin',
  role: 'admin',
  status: 'active',
};

// ─── Seed data ─────────────────────────────────────────────────────────────────

/** Tasks used as the mock GET /todolist response across suites. */
export const MOCK_TASKS: Task[] = [
  {
    id: 101,
    taskId: 'S1-001',
    description: 'Implement login feature',
    titulo: 'Implement login feature',
    descripcion: 'Build the login form and connect to auth API',
    prioridad: 'alta',
    estado: 'pendiente',
    done: false,
    createdAt: '2026-06-01T10:00:00Z',
    fechaLimite: '2026-06-20T18:00:00Z',
    horasEstimadas: 4,
    horasReales: 0,
    assignedUser: 'Test Developer',
    sprint: 'Sprint 1',
  },
  {
    id: 102,
    taskId: 'S1-002',
    description: 'Write unit tests',
    titulo: 'Write unit tests',
    descripcion: 'Add jest tests for components',
    prioridad: 'media',
    estado: 'completada',
    done: true,
    createdAt: '2026-06-02T09:00:00Z',
    fechaLimite: '2026-06-18T18:00:00Z',
    horasEstimadas: 3,
    horasReales: 2,
    assignedUser: 'Test Developer',
    sprint: 'Sprint 1',
  },
  {
    id: 103,
    taskId: 'S1-003',
    description: 'Deploy to OKE',
    titulo: 'Deploy to OKE',
    descripcion: 'Build Docker image and deploy to Oracle Kubernetes',
    prioridad: 'alta',
    estado: 'pendiente',
    done: false,
    createdAt: '2026-06-03T08:00:00Z',
    fechaLimite: '2026-06-25T18:00:00Z',
    horasEstimadas: 6,
    horasReales: 0,
    assignedUser: 'Juan Pablo',
    sprint: 'Sprint 1',
  },
];
