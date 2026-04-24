import { useCallback, useEffect, useMemo, useState } from 'react';
import API_LIST from '../../API';

const PRIORITY_ORDER = { alta: 3, media: 2, baja: 1 };
const TASK_ID_STORAGE = 'coqui_task_ids';

export const MOCK_TASKS = [
  {
    id: 71,
    taskId: 'S1-019',
    description: 'Daniel López 6am a 2pm centro de México',
    descripcion: '',
    prioridad: 'media',
    estado: 'pendiente',
    done: false,
    createdAt: '2026-04-20T08:30:00Z',
    fechaLimite: '2026-04-25T18:00:00Z',
    horasEstimadas: 0,
    horasReales: 0,
    assignedUser: 'Coqui',
    sprint: 'Sprint 1',
  },
  {
    id: 46,
    taskId: 'S1-018',
    description: 'Validar KPIs con Oswaldo y preparar demo',
    descripcion: 'Revision final de metricas y preparacion de presentacion',
    prioridad: 'alta',
    estado: 'completada',
    done: true,
    createdAt: '2026-04-18T14:00:00Z',
    fechaLimite: '2026-04-21T18:00:00Z',
    horasEstimadas: 4,
    horasReales: 5,
    assignedUser: 'Emilio',
    sprint: 'Sprint 1',
  },
  {
    id: 43,
    taskId: 'S1-017',
    description: 'Documentar evidencias de pruebas',
    descripcion: 'Capturas, logs y reporte final de QA',
    prioridad: 'media',
    estado: 'completada',
    done: true,
    createdAt: '2026-04-17T12:00:00Z',
    fechaLimite: '2026-04-19T18:00:00Z',
    horasEstimadas: 4,
    horasReales: 5,
    assignedUser: 'Fernanda',
    sprint: 'Sprint 1',
  },
  {
    id: 36,
    taskId: 'S1-016',
    description: 'Monitorear logs y estabilidad en OKE',
    descripcion: 'Revision de pods, restarts y conexion ATP',
    prioridad: 'media',
    estado: 'completada',
    done: true,
    createdAt: '2026-04-16T10:00:00Z',
    fechaLimite: '2026-04-18T18:00:00Z',
    horasEstimadas: 3,
    horasReales: 4,
    assignedUser: 'Esteban',
    sprint: 'Sprint 1',
  },
  {
    id: 40,
    taskId: 'S1-015',
    description: 'Documentar API con SpringDoc OpenAPI',
    descripcion: 'Reemplazar definicion legacy y validar Swagger UI',
    prioridad: 'media',
    estado: 'completada',
    done: true,
    createdAt: '2026-04-15T09:00:00Z',
    fechaLimite: '2026-04-17T18:00:00Z',
    horasEstimadas: 3,
    horasReales: 4,
    assignedUser: 'Juan',
    sprint: 'Sprint 1',
  },
];

function loadTaskIds() {
  try {
    return JSON.parse(localStorage.getItem(TASK_ID_STORAGE) || '{}');
  } catch {
    return {};
  }
}

function saveTaskId(id, taskId) {
  const map = loadTaskIds();
  map[String(id)] = taskId;
  try {
    localStorage.setItem(TASK_ID_STORAGE, JSON.stringify(map));
  } catch {}
}

function inferPriority(item) {
  return (item.prioridad || 'media').toLowerCase();
}

function inferStatus(item) {
  if (item.estado) return item.estado.toLowerCase();
  return item.done ? 'completada' : 'pendiente';
}

function buildFallbackHistory(item) {
  const events = [];
  if (item.createdAt) {
    events.push({ id: `c-${item.id}`, title: 'Tarea creada', date: item.createdAt, comment: '' });
  }
  if (item.done) {
    events.push({ id: `d-${item.id}`, title: 'Tarea completada', date: new Date().toISOString(), comment: '' });
  }
  return events;
}

function normalizeTask(taskIdMap, item) {
  const storedId = taskIdMap[String(item.id)];
  const sprintMatch = (item.descripcion || item.sprint || '').match(/Sprint\s*\d/i);
  const sprint = item.sprint || (sprintMatch ? sprintMatch[0] : null);

  return {
    id: item.id,
    taskId: storedId || item.taskId || null,
    title: item.titulo || item.description || item.title || 'Sin título',
    rawDescription: item.titulo || item.description || '',
    description: item.descripcion || '',
    project: 'COQUI BOT',
    assignedUser: item.assignedUser?.name || item.assignedUser || null,
    sprint,
    priority: inferPriority(item),
    status: inferStatus(item),
    done: Boolean(item.done),
    createdAt: item.createdAt || null,
    dueDate: item.fechaLimite || null,
    estimatedHours: item.horasEstimadas ?? 'N/A',
    realHours: item.horasReales ?? 'N/A',
    history: item.history || buildFallbackHistory(item),
    aiSuggestions: item.aiSuggestions || [],
  };
}

export function buildMetrics(tasks) {
  const total = tasks.length;
  const active = tasks.filter((task) => !task.done).length;
  const completed = tasks.filter((task) => task.done).length;
  const now = Date.now();
  const overdue = tasks.filter((task) => {
    if (task.done || !task.dueDate) return false;
    const due = new Date(task.dueDate).getTime();
    return !Number.isNaN(due) && due < now;
  }).length;

  return { total, active, completed, overdue };
}

export function filterTasksForUser(tasks, user) {
  if (!user) return [];

  const tokens = [
    user.username,
    user.name,
    user.name?.split(' ')[0],
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  return tasks.filter((task) => {
    if (!task.assignedUser) return false;
    return task.assignedUser
      .split(',')
      .map((name) => name.trim().toLowerCase())
      .some((assigned) => tokens.some((token) => assigned === token || assigned.includes(token) || token.includes(assigned)));
  });
}

export default function useTaskWorkspace(options = {}) {
  const {
    endpoint = API_LIST,
  } = options;
  const [isLoading, setLoading] = useState(false);
  const [isInserting, setInserting] = useState(false);
  const [isPreviewMode, setPreviewMode] = useState(false);
  const [items, setItems] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskDetailOpen, setTaskDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tareas');
  const [taskIdMap, setTaskIdMap] = useState(loadTaskIds);
  const [filters, setFilters] = useState({
    search: '',
    idSearch: '',
    sprint: 'All',
    status: 'All',
    priority: 'All',
    developer: 'All',
    sort: 'createdAt_desc',
  });
  const [error, setError] = useState();

  const recordActivity = useCallback((message, taskId) => {
    setActivityLog((prev) => [
      { id: `${Date.now()}-${Math.random()}`, message, taskId, createdAt: new Date().toISOString() },
      ...prev,
    ].slice(0, 40));
  }, []);

  const normalizedTasks = useMemo(
    () => items.map((item) => normalizeTask(taskIdMap, item)),
    [items, taskIdMap]
  );

  const statusOptions = useMemo(() => ['All', ...new Set(normalizedTasks.map((task) => task.status))], [normalizedTasks]);
  const priorityOptions = useMemo(() => ['All', ...new Set(normalizedTasks.map((task) => task.priority))], [normalizedTasks]);

  const developerOptions = useMemo(() => {
    const devs = new Set();
    normalizedTasks.forEach((task) => {
      if (task.assignedUser && task.assignedUser !== 'Sin asignar') {
        task.assignedUser.split(',').forEach((name) => {
          const cleanName = name.trim();
          if (cleanName) devs.add(cleanName);
        });
      }
    });
    return ['All', ...Array.from(devs).sort()];
  }, [normalizedTasks]);

  const filteredAndSortedTasks = useMemo(() => {
    let result = normalizedTasks.filter((task) => {
      const searchValue = filters.search.toLowerCase();
      const idValue = filters.idSearch.toUpperCase();
      const matchSearch = !searchValue || task.title.toLowerCase().includes(searchValue) || task.description.toLowerCase().includes(searchValue);
      const matchId = !idValue || (task.taskId && task.taskId.toUpperCase().includes(idValue)) || String(task.id).includes(idValue);
      const matchSprint = filters.sprint === 'All' || (task.sprint || '').toLowerCase().includes(filters.sprint.toLowerCase());
      const matchStatus = filters.status === 'All' || task.status === filters.status;
      const matchPriority = filters.priority === 'All' || task.priority === filters.priority;
      const matchDev = filters.developer === 'All'
        || (task.assignedUser && task.assignedUser.split(',').some((name) => name.trim() === filters.developer));
      return matchSearch && matchId && matchSprint && matchStatus && matchPriority && matchDev;
    });

    const [field, dir] = filters.sort.split('_');
    result = [...result].sort((a, b) => {
      let aValue;
      let bValue;
      if (field === 'createdAt') {
        aValue = new Date(a.createdAt || 0).getTime();
        bValue = new Date(b.createdAt || 0).getTime();
      } else if (field === 'priority') {
        aValue = PRIORITY_ORDER[a.priority] || 0;
        bValue = PRIORITY_ORDER[b.priority] || 0;
      } else if (field === 'title') {
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
      } else if (field === 'estimatedHours') {
        aValue = parseFloat(a.estimatedHours) || 0;
        bValue = parseFloat(b.estimatedHours) || 0;
      } else {
        return 0;
      }

      if (aValue < bValue) return dir === 'asc' ? -1 : 1;
      if (aValue > bValue) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [filters, normalizedTasks]);

  const metrics = useMemo(() => buildMetrics(normalizedTasks), [normalizedTasks]);

  function deleteItem(deleteId) {
    if (isPreviewMode) {
      setItems((prev) => prev.filter((item) => item.id !== deleteId));
      recordActivity(`Tarea #${deleteId} eliminada en preview local`, deleteId);
      if (selectedTask && String(selectedTask.id) === String(deleteId)) {
        setTaskDetailOpen(false);
        setSelectedTask(null);
      }
      return;
    }

    fetch(`${API_LIST}/${deleteId}`, { method: 'DELETE' })
      .then((response) => {
        if (response.ok) return response;
        throw new Error('Error al eliminar');
      })
      .then(() => {
        setItems(items.filter((item) => item.id !== deleteId));
        recordActivity(`Tarea #${deleteId} eliminada`, deleteId);
        if (selectedTask && String(selectedTask.id) === String(deleteId)) {
          setTaskDetailOpen(false);
          setSelectedTask(null);
        }
      })
      .catch((err) => setError(err));
  }

  function toggleDone(event, id, description, done, realHours) {
    event.preventDefault();

    if (isPreviewMode) {
      setItems((prev) => prev.map((item) => (String(item.id) === String(id)
        ? {
            ...item,
            done,
            estado: done ? 'completada' : 'pendiente',
            horasReales: done && realHours != null ? realHours : (done ? item.horasReales : 0),
          }
        : item)));
      recordActivity(`Tarea #${id} marcada como ${done ? 'completada' : 'pendiente'} en preview local`, id);
      return;
    }

    const data = { description, done };
    if (done && realHours != null) data.horasReales = realHours;

    fetch(`${API_LIST}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) return response;
        throw new Error('Error al actualizar');
      })
      .then(() => {
        setItems(items.map((item) => (String(item.id) === String(id)
          ? { ...item, done, horasReales: done && realHours != null ? realHours : item.horasReales }
          : item)));
        recordActivity(`Tarea #${id} marcada como ${done ? 'completada' : 'pendiente'}`, id);
      })
      .catch((err) => setError(err));
  }

  function updateTaskDetails(id, payload) {
    const normalizedPayload = {
      description: payload.title,
      assignedUser: payload.assignedUser,
      horasEstimadas: payload.estimatedHours != null && payload.estimatedHours !== ''
        ? parseFloat(payload.estimatedHours)
        : undefined,
    };

    if (isPreviewMode) {
      const updatedItem = items.find((item) => String(item.id) === String(id));
      const nextItem = {
        ...updatedItem,
        titulo: normalizedPayload.description,
        description: normalizedPayload.description,
        assignedUser: normalizedPayload.assignedUser,
        horasEstimadas: normalizedPayload.horasEstimadas ?? updatedItem?.horasEstimadas ?? 0,
      };

      setItems((prev) => prev.map((item) => (String(item.id) === String(id) ? nextItem : item)));
      setSelectedTask((prev) => (prev && String(prev.id) === String(id) ? normalizeTask(taskIdMap, nextItem) : prev));
      recordActivity(`Tarea #${id} actualizada en preview local`, id);
      return Promise.resolve(normalizeTask(taskIdMap, nextItem));
    }

    return fetch(`${API_LIST}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedPayload),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Error al guardar cambios');
        return response.json();
      })
      .then((updatedItem) => {
        setItems((prev) => prev.map((item) => (String(item.id) === String(id)
          ? { ...item, ...updatedItem }
          : item)));
        const normalized = normalizeTask(taskIdMap, updatedItem);
        setSelectedTask((prev) => (prev && String(prev.id) === String(id) ? normalized : prev));
        recordActivity(`Tarea #${id} actualizada`, id);
        return normalized;
      })
      .catch((err) => {
        setError(err);
        throw err;
      });
  }

  const loadTasks = useCallback(() => {
    setLoading(true);
    fetch(endpoint)
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error('Error al cargar tareas');
      })
      .then((result) => {
        setLoading(false);
        setPreviewMode(false);
        setError(undefined);
        setItems(result);
        recordActivity('Tareas sincronizadas');
      })
      .catch(() => {
        setLoading(false);
        setPreviewMode(true);
        setError(undefined);
        setItems(MOCK_TASKS);
        recordActivity('Preview local activado con tareas mock');
      });
  }, [endpoint, recordActivity]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function addItem(taskData) {
    setInserting(true);
    const payload = typeof taskData === 'string' ? { description: taskData, done: false } : taskData;

    if (isPreviewMode) {
      const nextId = Date.now();
      const newItem = {
        id: nextId,
        taskId: payload.taskId || null,
        titulo: payload.titulo,
        description: payload.description || payload.titulo,
        descripcion: payload.descripcion,
        prioridad: payload.prioridad || 'media',
        estado: 'pendiente',
        done: false,
        createdAt: new Date().toISOString(),
        fechaLimite: payload.fechaLimite || null,
        horasEstimadas: payload.horasEstimadas || 0,
        horasReales: 0,
        assignedUser: payload.assignedUser || null,
        sprint: payload.sprint || null,
      };

      if (payload.taskId) {
        saveTaskId(nextId, payload.taskId);
        setTaskIdMap((prev) => ({ ...prev, [String(nextId)]: payload.taskId }));
      }

      setItems((prev) => [newItem, ...prev]);
      setInserting(false);
      recordActivity(`Tarea ${payload.taskId || `#${nextId}`} creada en preview local`, nextId);
      return;
    }

    fetch(API_LIST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.ok) return response;
        throw new Error('Error al crear tarea');
      })
      .then((result) => {
        const id = result.headers.get('location');
        if (payload.taskId && id) {
          saveTaskId(id, payload.taskId);
          setTaskIdMap((prev) => ({ ...prev, [String(id)]: payload.taskId }));
        }

        const newItem = {
          id,
          titulo: payload.titulo,
          description: payload.description,
          descripcion: payload.descripcion,
          prioridad: payload.prioridad || 'media',
          estado: 'pendiente',
          done: false,
          createdAt: new Date().toISOString(),
          fechaLimite: payload.fechaLimite || null,
          horasEstimadas: payload.horasEstimadas || 0,
          horasReales: 0,
          assignedUser: payload.assignedUser || null,
          sprint: payload.sprint || null,
          taskId: payload.taskId || null,
        };

        setItems([newItem, ...items]);
        setInserting(false);
        recordActivity(`Tarea ${payload.taskId || `#${id}`} creada: ${payload.titulo}`, id);
      })
      .catch((err) => {
        setInserting(false);
        setError(err);
      });
  }

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function resetFilters() {
    setFilters({
      search: '',
      idSearch: '',
      sprint: 'All',
      status: 'All',
      priority: 'All',
      developer: 'All',
      sort: 'createdAt_desc',
    });
  }

  function openTaskDetails(task) {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  }

  function closeTaskDetails() {
    setTaskDetailOpen(false);
  }

  return {
    isLoading,
    isInserting,
    isPreviewMode,
    activeTab,
    setActiveTab,
    filters,
    error,
    activityLog,
    normalizedTasks,
    filteredAndSortedTasks,
    metrics,
    statusOptions,
    priorityOptions,
    developerOptions,
    selectedTask,
    isTaskDetailOpen,
    addItem,
    deleteItem,
    toggleDone,
    updateTaskDetails,
    handleFilterChange,
    resetFilters,
    openTaskDetails,
    closeTaskDetails,
    reloadTasks: loadTasks,
  };
}
