/*
## MyToDoReact version 1.0.
##
## Copyright (c) 2022 Oracle, Inc.
## Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl/
*/

import React, { useState, useEffect, useMemo } from 'react';
import API_LIST from './API';
import { CircularProgress } from '@mui/material';
import Topbar from './components/Topbar';
import SummaryCards from './components/SummaryCards';
import TaskFilters from './components/TaskFilters';
import TaskComposer from './components/TaskComposer';
import TaskTable from './components/TaskTable';
import TaskDetailDrawer from './components/TaskDetailDrawer';
import TeamChannel from './components/TeamChannel';
import KPIDashboard from './components/Kpidashboard';

const PRIORITY_ORDER = { alta: 3, media: 2, baja: 1 };
const TASK_ID_STORAGE = 'coqui_task_ids';

function loadTaskIds() {
  try { return JSON.parse(localStorage.getItem(TASK_ID_STORAGE) || '{}'); } catch { return {}; }
}
function saveTaskId(id, taskId) {
  const map = loadTaskIds();
  map[String(id)] = taskId;
  try { localStorage.setItem(TASK_ID_STORAGE, JSON.stringify(map)); } catch {}
}

function App() {
  const [isLoading, setLoading] = useState(false);
  const [isInserting, setInserting] = useState(false);
  const [items, setItems] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskDetailOpen, setTaskDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tareas');
  const [taskIdMap, setTaskIdMap] = useState(loadTaskIds);
  const [filters, setFilters] = useState({
    search: '', idSearch: '', sprint: 'All',
    status: 'All', priority: 'All', developer: 'All', sort: 'createdAt_desc',
  });
  const [error, setError] = useState();

  function recordActivity(message, taskId) {
    setActivityLog(prev => [
      { id: `${Date.now()}-${Math.random()}`, message, taskId, createdAt: new Date().toISOString() },
      ...prev
    ].slice(0, 40));
  }

  function inferPriority(item) { return (item.prioridad || 'media').toLowerCase(); }
  function inferStatus(item) {
    if (item.estado) return item.estado.toLowerCase();
    return item.done ? 'completada' : 'pendiente';
  }

  function buildFallbackHistory(item) {
    const events = [];
    if (item.createdAt) events.push({ id: `c-${item.id}`, title: 'Tarea creada', date: item.createdAt, comment: '' });
    if (item.done) events.push({ id: `d-${item.id}`, title: 'Tarea completada', date: new Date().toISOString(), comment: '' });
    return events;
  }

  function normalizeTask(item) {
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
      history: buildFallbackHistory(item),
      aiSuggestions: [],
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const normalizedTasks = useMemo(() => items.map(normalizeTask), [items, activityLog, taskIdMap]);

  const statusOptions = useMemo(() => ['All', ...new Set(normalizedTasks.map(t => t.status))], [normalizedTasks]);
  const priorityOptions = useMemo(() => ['All', ...new Set(normalizedTasks.map(t => t.priority))], [normalizedTasks]);

  const developerOptions = useMemo(() => {
    const devs = new Set();
    normalizedTasks.forEach(t => {
      if (t.assignedUser && t.assignedUser !== 'Sin asignar') {
        t.assignedUser.split(',').forEach(n => { const x = n.trim(); if (x) devs.add(x); });
      }
    });
    return ['All', ...Array.from(devs).sort()];
  }, [normalizedTasks]);

  const filteredAndSortedTasks = useMemo(() => {
    let result = normalizedTasks.filter(task => {
      const sv = filters.search.toLowerCase();
      const iv = filters.idSearch.toUpperCase();
      const matchSearch = !sv || task.title.toLowerCase().includes(sv) || task.description.toLowerCase().includes(sv);
      const matchId = !iv || (task.taskId && task.taskId.toUpperCase().includes(iv)) || String(task.id).includes(iv);
      const matchSprint = filters.sprint === 'All' || (task.sprint || '').toLowerCase().includes(filters.sprint.toLowerCase());
      const matchStatus = filters.status === 'All' || task.status === filters.status;
      const matchPriority = filters.priority === 'All' || task.priority === filters.priority;
      const matchDev = filters.developer === 'All' || (task.assignedUser && task.assignedUser.split(',').some(n => n.trim() === filters.developer));
      return matchSearch && matchId && matchSprint && matchStatus && matchPriority && matchDev;
    });

    const [field, dir] = filters.sort.split('_');
    result = [...result].sort((a, b) => {
      let aV, bV;
      if (field === 'createdAt') { aV = new Date(a.createdAt || 0).getTime(); bV = new Date(b.createdAt || 0).getTime(); }
      else if (field === 'priority') { aV = PRIORITY_ORDER[a.priority] || 0; bV = PRIORITY_ORDER[b.priority] || 0; }
      else if (field === 'title') { aV = a.title.toLowerCase(); bV = b.title.toLowerCase(); }
      else if (field === 'estimatedHours') { aV = parseFloat(a.estimatedHours) || 0; bV = parseFloat(b.estimatedHours) || 0; }
      else return 0;
      if (aV < bV) return dir === 'asc' ? -1 : 1;
      if (aV > bV) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [normalizedTasks, filters]);

  const metrics = useMemo(() => {
    const total = normalizedTasks.length;
    const active = normalizedTasks.filter(t => !t.done).length;
    const completed = normalizedTasks.filter(t => t.done).length;
    const now = Date.now();
    const overdue = normalizedTasks.filter(t => {
      if (t.done || !t.dueDate) return false;
      const due = new Date(t.dueDate).getTime();
      return !Number.isNaN(due) && due < now;
    }).length;
    return { total, active, completed, overdue };
  }, [normalizedTasks]);

  function deleteItem(deleteId) {
    fetch(API_LIST + '/' + deleteId, { method: 'DELETE' })
      .then(r => { if (r.ok) return r; throw new Error('Error al eliminar'); })
      .then(() => {
        setItems(items.filter(x => x.id !== deleteId));
        recordActivity(`Tarea #${deleteId} eliminada`, deleteId);
        if (selectedTask && String(selectedTask.id) === String(deleteId)) { setTaskDetailOpen(false); setSelectedTask(null); }
      })
      .catch(err => setError(err));
  }

  function toggleDone(event, id, description, done, realHours) {
    event.preventDefault();
    const data = { description, done };
    if (done && realHours != null) data.horasReales = realHours;
    fetch(API_LIST + '/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(r => { if (r.ok) return r; throw new Error('Error al actualizar'); })
      .then(() => {
        setItems(items.map(x => String(x.id) === String(id)
          ? { ...x, done, horasReales: done && realHours != null ? realHours : x.horasReales }
          : x));
        recordActivity(`Tarea #${id} marcada como ${done ? 'completada' : 'pendiente'}`, id);
      })
      .catch(err => setError(err));
  }

  useEffect(() => {
    setLoading(true);
    fetch(API_LIST)
      .then(r => { if (r.ok) return r.json(); throw new Error('Error al cargar tareas'); })
      .then(result => { setLoading(false); setItems(result); recordActivity('Tareas sincronizadas'); })
      .catch(err => { setLoading(false); setError(err); });
  }, []);

  function addItem(taskData) {
    setInserting(true);
    const payload = typeof taskData === 'string' ? { description: taskData, done: false } : taskData;
    fetch(API_LIST, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(r => { if (r.ok) return r; throw new Error('Error al crear tarea'); })
      .then(result => {
        const id = result.headers.get('location');
        if (payload.taskId && id) {
          saveTaskId(id, payload.taskId);
          setTaskIdMap(prev => ({ ...prev, [String(id)]: payload.taskId }));
        }
        const newItem = {
          id, titulo: payload.titulo, description: payload.description,
          descripcion: payload.descripcion, prioridad: payload.prioridad || 'media',
          estado: 'pendiente', done: false, createdAt: new Date().toISOString(),
          fechaLimite: payload.fechaLimite || null, horasEstimadas: payload.horasEstimadas || 0,
          horasReales: 0, assignedUser: payload.assignedUser || null,
          sprint: payload.sprint || null, taskId: payload.taskId || null,
        };
        setItems([newItem, ...items]);
        setInserting(false);
        recordActivity(`Tarea ${payload.taskId || '#' + id} creada: ${payload.titulo}`, id);
      })
      .catch(err => { setInserting(false); setError(err); });
  }

  function handleFilterChange(field, value) {
    setFilters(prev => ({ ...prev, [field]: value }));
  }

  function resetFilters() {
    setFilters({ search: '', idSearch: '', sprint: 'All', status: 'All', priority: 'All', developer: 'All', sort: 'createdAt_desc' });
  }

  const tabStyle = (tab) => ({
    padding: '9px 22px', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: activeTab === tab ? 700 : 500,
    background: activeTab === tab ? 'var(--bg-raised-3)' : 'transparent',
    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)',
    transition: 'all 0.15s ease',
  });

  return (
    <>
      <Topbar />
      <main className="main-layout">
        <div className="main-content">
          {error && (
            <section className="error-banner" role="alert">
              <strong>Error al procesar la solicitud.</strong>
              <span>{error.message}</span>
            </section>
          )}

          <SummaryCards metrics={metrics} />

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '4px', marginBottom: '1.25rem',
            background: 'var(--surface-secondary)', padding: '5px',
            borderRadius: 'var(--radius-lg)', width: 'fit-content',
            border: '1px solid var(--border-subtle)'
          }}>
            <button style={tabStyle('tareas')} onClick={() => setActiveTab('tareas')}>📋 Tareas</button>
            <button style={tabStyle('kpis')} onClick={() => setActiveTab('kpis')}>📊 Indicadores KPI</button>
          </div>

          {activeTab === 'tareas' && (
            <>
              {/* Búsqueda por ID */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '1rem', background: 'var(--surface-secondary)',
                border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
                padding: '12px 18px'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', fontWeight: 700 }}>
                  🔍 Buscar por ID
                </span>
                <input
                  type="text"
                  value={filters.idSearch}
                  onChange={e => handleFilterChange('idSearch', e.target.value)}
                  placeholder="Ej. S1-001, S2-003..."
                  style={{
                    flex: 1, padding: '8px 14px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)', background: 'var(--bg-raised-2)',
                    color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'monospace',
                  }}
                />
                {filters.idSearch && (
                  <button type="button" onClick={() => handleFilterChange('idSearch', '')} style={{
                    background: 'transparent', border: 'none', color: 'var(--text-tertiary)',
                    cursor: 'pointer', fontSize: '1rem', padding: '4px 8px'
                  }}>✕</button>
                )}
              </div>

              <TaskComposer onAddItem={addItem} isInserting={isInserting} existingTasks={normalizedTasks} />

              <TaskFilters
                filters={filters}
                onChange={handleFilterChange}
                statusOptions={statusOptions}
                priorityOptions={priorityOptions}
                developerOptions={developerOptions}
                onReset={resetFilters}
              />

              {isLoading ? (
                <div className="loading-state" role="status">
                  <CircularProgress />
                  <p>Cargando tareas...</p>
                </div>
              ) : (
                <TaskTable
                  tasks={filteredAndSortedTasks}
                  onToggleDone={toggleDone}
                  onDelete={deleteItem}
                  onOpenDetails={(task) => { setSelectedTask(task); setTaskDetailOpen(true); }}
                />
              )}

              <TeamChannel />
            </>
          )}

          {activeTab === 'kpis' && <KPIDashboard />}
        </div>
      </main>

      <TaskDetailDrawer
        open={isTaskDetailOpen}
        onClose={() => setTaskDetailOpen(false)}
        task={selectedTask}
      />
    </>
  );
}

export default App;