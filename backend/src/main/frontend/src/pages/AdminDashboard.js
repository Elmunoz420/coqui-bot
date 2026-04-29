import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CircularProgress } from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import AddTaskRoundedIcon from '@mui/icons-material/AddTaskRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import SummaryCards from '../components/SummaryCards';
import TaskFilters from '../components/TaskFilters';
import TaskComposer from '../components/TaskComposer';
import TaskTable from '../components/TaskTable';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import TeamChannel from '../components/TeamChannel';
import KPIDashboard from '../components/Kpidashboard';
import AIGeneratedInsightPanel from '../components/AIGeneratedInsightPanel';
import useTaskWorkspace from '../features/tasks/useTaskWorkspace';
import useAuth from '../app/auth/useAuth';
import WorkspaceShell from '../components/layout/WorkspaceShell';

const TEAM_MEMBERS = [
  { id: 'joaquin', name: 'Joaquín', fullName: 'Joaquín Hiroki', color: '#4A9EFF' },
  { id: 'esteban', name: 'Esteban', fullName: 'Esteban Muñoz', color: '#FF6B35' },
  { id: 'juanpablo', name: 'Juan Pablo', fullName: 'Juan Pablo Buenrostro', color: '#51CF66' },
  { id: 'fernanda', name: 'Fernanda', fullName: 'Fernanda Jiménez', color: '#FF6B9D' },
  { id: 'emilio', name: 'Emilio', fullName: 'Emilio Pardo', color: '#FFD43B' },
];

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha';
  return parsed.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toDateInput(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

function toDateKey(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
}

function getSprintNumber(sprint) {
  const match = String(sprint || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function taskBelongsToMember(task, member) {
  const assigned = (task.assignedUser || '').toLowerCase();
  return assigned.includes(member.name.toLowerCase()) || assigned.includes(member.id.toLowerCase());
}

function MiniBarChart({ tasks }) {
  const sprints = Array.from(new Set(tasks.map((task) => task.sprint).filter(Boolean)))
    .sort((a, b) => getSprintNumber(a) - getSprintNumber(b))
    .slice(-2);
  const activeSprints = sprints.length ? sprints : ['Sprint 0', 'Sprint 1'];
  const maxValue = Math.max(
    1,
    ...activeSprints.flatMap((sprint) => TEAM_MEMBERS.map((member) => (
      tasks.filter((task) => task.sprint === sprint && task.done && taskBelongsToMember(task, member)).length
    )))
  );

  return (
    <article className="admin-chart-card">
      <div className="panel-header">
        <div>
          <h2>Tareas Completadas por Sprint</h2>
          <p>Grouped by developer, completed tasks only</p>
        </div>
        <span className="admin-select-chip">Últimos 2 sprints</span>
      </div>
      <div className="admin-bars">
        {activeSprints.map((sprint) => (
          <div key={sprint} className="admin-bar-group">
            <div className="admin-bar-set">
              {TEAM_MEMBERS.map((member) => {
                const count = tasks.filter((task) => task.sprint === sprint && task.done && taskBelongsToMember(task, member)).length;
                return (
                  <div key={member.id} className="admin-bar-column">
                    <span>{count}</span>
                    <div
                      className="admin-bar"
                      style={{ height: `${Math.max(8, (count / maxValue) * 150)}px`, background: member.color }}
                      title={`${member.name}: ${count}`}
                    />
                  </div>
                );
              })}
            </div>
            <strong>{sprint}</strong>
          </div>
        ))}
      </div>
      <div className="admin-chart-legend">
        {TEAM_MEMBERS.map((member) => (
          <span key={member.id}><i style={{ background: member.color }} />{member.name}</span>
        ))}
      </div>
    </article>
  );
}

function MiniLineChart({ tasks }) {
  const sprints = Array.from(new Set(tasks.map((task) => task.sprint).filter(Boolean)))
    .sort((a, b) => getSprintNumber(a) - getSprintNumber(b));
  const labels = sprints.length ? sprints.slice(-6) : ['Sprint 0', 'Sprint 1', 'Sprint 2', 'Sprint 3'];
  const width = 620;
  const height = 220;
  const pad = 32;
  const series = TEAM_MEMBERS.map((member) => ({
    ...member,
    values: labels.map((label) => tasks
      .filter((task) => task.sprint === label && taskBelongsToMember(task, member))
      .reduce((sum, task) => sum + (parseFloat(task.realHours) || 0), 0)),
  }));
  const maxValue = Math.max(1, ...series.flatMap((member) => member.values));
  const xFor = (index) => pad + (index / Math.max(1, labels.length - 1)) * (width - pad * 2);
  const yFor = (value) => height - pad - (value / maxValue) * (height - pad * 2);

  return (
    <article className="admin-chart-card">
      <div className="panel-header">
        <div>
          <h2>Horas Reales por Desarrollador</h2>
          <p>Real hours logged per developer across sprints</p>
        </div>
        <span className="admin-select-chip">Últimos 6 sprints</span>
      </div>
      <div className="admin-line-chart">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Horas reales por desarrollador">
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = yFor(maxValue * tick);
            return <line key={tick} x1={pad} x2={width - pad} y1={y} y2={y} className="admin-grid-line" />;
          })}
          {series.map((member) => {
            const points = member.values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ');
            return (
              <g key={member.id}>
                <polyline points={points} fill="none" stroke={member.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                {member.values.map((value, index) => (
                  <circle key={`${member.id}-${labels[index]}`} cx={xFor(index)} cy={yFor(value)} r="5" fill={member.color}>
                    <title>{`${member.name} ${labels[index]}: ${value}h`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
          {labels.map((label, index) => (
            <text key={label} x={xFor(index)} y={height - 8} textAnchor="middle" className="admin-axis-label">{label.replace('Sprint ', 'S')}</text>
          ))}
        </svg>
      </div>
      <div className="admin-chart-legend">
        {TEAM_MEMBERS.map((member) => (
          <span key={member.id}><i style={{ background: member.color }} />{member.name}</span>
        ))}
      </div>
    </article>
  );
}

function ActivityFeed({ tasks }) {
  const recent = [...tasks]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return (
    <article className="admin-side-card">
      <div className="panel-header"><div><h2>Actividad Reciente</h2><p>Últimos movimientos del equipo</p></div></div>
      <div className="admin-activity-list">
        {recent.map((task, index) => (
          <button key={task.id} type="button" className="admin-activity-row">
            <span className={`admin-activity-icon tone-${index % 4}`}><DoneAllRoundedIcon fontSize="small" /></span>
            <span><strong>{task.assignedUser || 'Equipo'}</strong> {task.done ? 'completó' : 'actualizó'} la tarea {task.taskId || `#${task.id}`}</span>
            <small>{formatDate(task.createdAt)}</small>
          </button>
        ))}
      </div>
    </article>
  );
}

function AdminCalendarView({ tasks }) {
  const calendarRef = useRef(null);
  const todayRef = useRef(null);
  const today = new Date();
  const todayKey = toDateKey(today);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());
  const firstVisibleMonth = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth() - 1, 1);
  const monthSections = Array.from({ length: 5 }, (_, index) => {
    const sectionMonth = new Date(firstVisibleMonth.getFullYear(), firstVisibleMonth.getMonth() + index, 1);
    const sectionStart = new Date(sectionMonth);
    sectionStart.setDate(sectionMonth.getDate() - sectionMonth.getDay());
    const nextMonth = new Date(sectionMonth.getFullYear(), sectionMonth.getMonth() + 1, 1);
    const sectionEnd = new Date(nextMonth);
    sectionEnd.setDate(0);
    sectionEnd.setDate(sectionEnd.getDate() + (6 - sectionEnd.getDay()));
    const totalDays = Math.round((sectionEnd - sectionStart) / 86400000) + 1;

    return {
      key: `${sectionMonth.getFullYear()}-${sectionMonth.getMonth()}`,
      month: sectionMonth,
      label: sectionMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
      days: Array.from({ length: totalDays }, (_, dayIndex) => {
        const date = new Date(sectionStart);
        date.setDate(sectionStart.getDate() + dayIndex);
        return date;
      }),
    };
  });
  const tasksByDate = tasks.reduce((acc, task) => {
    const key = toDateKey(task.dueDate);
    if (!key) return acc;
    acc[key] = [...(acc[key] || []), task];
    return acc;
  }, {});
  Object.keys(tasksByDate).forEach((key) => {
    tasksByDate[key].sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
  });
  const monthLabel = monthStart.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  useEffect(() => {
    if (!calendarRef.current || !todayRef.current) return;
    calendarRef.current.scrollTop = Math.max(0, todayRef.current.offsetTop - calendarRef.current.offsetTop - 8);
  }, [todayKey, tasks.length]);

  return (
    <section className="admin-calendar-card">
      <div className="panel-header">
        <div>
          <h2>Calendario</h2>
          <p>Fechas límite y carga del equipo por día.</p>
        </div>
        <span className="admin-select-chip">{monthLabel}</span>
      </div>

      <div className="admin-calendar-scroll" ref={calendarRef}>
        {monthSections.map((section) => (
          <div key={section.key} className="admin-calendar-month-section">
            <h3>{section.label}</h3>
            <div className="admin-calendar-weekdays">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="admin-calendar-grid">
              {section.days.map((day) => {
                const key = toDateKey(day);
                const dayTasks = tasksByDate[key] || [];
                const isCurrentMonth = day.getMonth() === section.month.getMonth();
                const isToday = key === todayKey && isCurrentMonth;
                return (
                  <article
                    key={`${section.key}-${key}`}
                    ref={isToday ? todayRef : null}
                    className={`admin-calendar-day ${isCurrentMonth ? '' : 'muted'} ${dayTasks.length ? 'has-tasks' : ''} ${isToday ? 'today' : ''}`}
                  >
                    <div className="admin-calendar-day-header">
                      <strong>{day.getDate()}</strong>
                      {isToday && <em>Hoy</em>}
                      {dayTasks.length > 0 && <span>{dayTasks.length}</span>}
                    </div>
                    <div className="admin-calendar-task-list">
                      {dayTasks.slice(0, 3).map((task) => (
                        <button key={task.id} type="button" className={`admin-calendar-task priority-${task.priority}`}>
                          <span>{task.taskId || `#${task.id}`}</span>
                          {task.title}
                        </button>
                      ))}
                      {dayTasks.length > 3 && <small>+{dayTasks.length - 3} más</small>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TeamSummarySection({ title, teamSummary }) {
  return (
    <section className="panel-surface">
      <div className="panel-header"><div><h2>{title}</h2><p>Visión rápida por miembro</p></div></div>
      <div className="activity-list">
        {teamSummary.map(([name, count]) => (
          <div key={name} className="activity-item">
            <div className="activity-icon"><GroupsRoundedIcon fontSize="small" /></div>
            <div><strong>{name}</strong><span>{count} tareas asignadas</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TaskEditModal({ task, open, onClose, onSave, isSaving }) {
  const [form, setForm] = useState({
    title: '',
    descripcion: '',
    prioridad: 'media',
    sprint: 'Sprint 1',
    fechaLimite: '',
    horasEstimadas: '',
    horasReales: '',
    done: false,
    assignedIds: [],
  });

  useEffect(() => {
    if (!task) return;
    const assignedIds = TEAM_MEMBERS
      .filter((member) => taskBelongsToMember(task, member))
      .map((member) => member.id);

    setForm({
      title: task.title || '',
      descripcion: task.description || '',
      prioridad: task.priority || 'media',
      sprint: task.sprint || 'Sprint 1',
      fechaLimite: toDateInput(task.dueDate),
      horasEstimadas: task.estimatedHours && task.estimatedHours !== 'N/A' ? String(task.estimatedHours) : '',
      horasReales: task.realHours && task.realHours !== 'N/A' ? String(task.realHours) : '',
      done: Boolean(task.done),
      assignedIds,
    });
  }, [task]);

  if (!open || !task) return null;

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const toggleMember = (memberId) => {
    setForm((prev) => ({
      ...prev,
      assignedIds: prev.assignedIds.includes(memberId)
        ? prev.assignedIds.filter((id) => id !== memberId)
        : [...prev.assignedIds, memberId],
    }));
  };

  function handleSubmit(event) {
    event.preventDefault();
    const assignedUser = TEAM_MEMBERS
      .filter((member) => form.assignedIds.includes(member.id))
      .map((member) => member.fullName)
      .join(', ');

    onSave(task.id, {
      title: form.title.trim(),
      descripcion: form.descripcion.trim(),
      prioridad: form.prioridad,
      sprint: form.sprint,
      fechaLimite: form.fechaLimite ? `${form.fechaLimite}T18:00:00Z` : null,
      horasEstimadas: form.horasEstimadas,
      horasReales: form.horasReales,
      done: form.done,
      assignedUser: assignedUser || 'Sin asignar',
    }).then(onClose).catch(() => {});
  }

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <form className="admin-edit-modal" onSubmit={handleSubmit}>
        <div className="panel-header">
          <div>
            <h2>Editar tarea</h2>
            <p>{task.taskId || `#${task.id}`}</p>
          </div>
          <button type="button" className="secondary-button" onClick={onClose}>Cerrar</button>
        </div>

        <div className="admin-edit-grid">
          <div className="field">
            <label htmlFor="editTitle">Título</label>
            <input id="editTitle" value={form.title} onChange={(event) => setField('title', event.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="editSprint">Sprint</label>
            <select id="editSprint" value={form.sprint} onChange={(event) => setField('sprint', event.target.value)}>
              {['Sprint 0', 'Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5'].map((sprint) => <option key={sprint}>{sprint}</option>)}
            </select>
          </div>
          <div className="field admin-wide-field">
            <label htmlFor="editDescription">Descripción</label>
            <textarea id="editDescription" value={form.descripcion} onChange={(event) => setField('descripcion', event.target.value)} rows="3" />
          </div>
          <div className="field">
            <label htmlFor="editPriority">Prioridad</label>
            <select id="editPriority" value={form.prioridad} onChange={(event) => setField('prioridad', event.target.value)}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="editDueDate">Fecha límite</label>
            <input id="editDueDate" type="date" value={form.fechaLimite} onChange={(event) => setField('fechaLimite', event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="editEstimated">Horas estimadas</label>
            <input id="editEstimated" type="number" min="0" step="0.5" value={form.horasEstimadas} onChange={(event) => setField('horasEstimadas', event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="editReal">Horas reales</label>
            <input id="editReal" type="number" min="0" step="0.5" value={form.horasReales} onChange={(event) => setField('horasReales', event.target.value)} />
          </div>
          <label className="admin-check-row">
            <input type="checkbox" checked={form.done} onChange={(event) => setField('done', event.target.checked)} />
            Marcar como completada
          </label>
          <div className="field admin-wide-field">
            <label>Asignar a</label>
            <div className="admin-member-picker">
              {TEAM_MEMBERS.map((member) => {
                const selected = form.assignedIds.includes(member.id);
                return (
                  <button key={member.id} type="button" className={selected ? 'selected' : ''} onClick={() => toggleMember(member.id)}>
                    <span style={{ background: member.color }} />{member.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="admin-modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar cambios'}</button>
        </div>
      </form>
    </div>
  );
}

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [editingTask, setEditingTask] = useState(null);
  const {
    user,
    logout,
  } = useAuth();

  const [coquiInsight, setCoquiInsight] = React.useState({
    title: 'Coqui suggestion',
    subtitle: 'Cargando análisis del equipo...',
    bullets: [{ label: 'Estado', value: 'Conectando con Coqui...' }]
  });

  React.useEffect(() => {
    fetch('/api/ai/insights/admin')
      .then(r => r.json())
      .then(data => setCoquiInsight(data))
      .catch(() => {});
  }, []);
  const {
    isLoading,
    isInserting,
    isUpdating,
    filters,
    error,
    metrics,
    statusOptions,
    priorityOptions,
    developerOptions,
    normalizedTasks,
    filteredAndSortedTasks,
    selectedTask,
    isTaskDetailOpen,
    addItem,
    updateItem,
    deleteItem,
    toggleDone,
    handleFilterChange,
    resetFilters,
    openTaskDetails,
    closeTaskDetails,
  } = useTaskWorkspace();

  const summaryItems = [
    { key: 'total', label: 'Total de tareas', tone: 'neutral', helper: '8 vs semana anterior', icon: <ChecklistRoundedIcon fontSize="small" /> },
    { key: 'active', label: 'Tareas activas', tone: 'info', helper: '0% vs semana anterior', icon: <AccessTimeRoundedIcon fontSize="small" /> },
    { key: 'completed', label: 'Tareas completadas', tone: 'success', helper: '15 vs semana anterior', icon: <AssignmentTurnedInRoundedIcon fontSize="small" /> },
    { key: 'overdue', label: 'Tareas vencidas', tone: 'danger', helper: '0% vs semana anterior', icon: <FlagRoundedIcon fontSize="small" /> },
  ];

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: DashboardRoundedIcon, onClick: () => setActiveSection('overview') },
    { id: 'tasks', label: 'Tareas', icon: ChecklistRoundedIcon, onClick: () => setActiveSection('tasks') },
    { id: 'sprints', label: 'Sprints', icon: FlagRoundedIcon, onClick: () => setActiveSection('sprints') },
    { id: 'calendar', label: 'Calendario', icon: CalendarMonthRoundedIcon, onClick: () => setActiveSection('calendar') },
    { id: 'kpis', label: 'Indicadores KPI', icon: InsightsRoundedIcon, onClick: () => setActiveSection('kpis') },
    { id: 'users', label: 'Usuarios', icon: PeopleAltRoundedIcon, onClick: () => setActiveSection('users') },
    { id: 'teams', label: 'Equipos', icon: GroupsRoundedIcon, onClick: () => setActiveSection('teams') },
    { id: 'settings', label: 'Ajustes', icon: SettingsRoundedIcon, onClick: () => setActiveSection('settings') },
  ];

  const sprintSummary = useMemo(() => {
    const counts = {};
    normalizedTasks.forEach((task) => {
      const sprint = task.sprint || 'Sin sprint';
      counts[sprint] = (counts[sprint] || 0) + 1;
    });
    return Object.entries(counts);
  }, [normalizedTasks]);

  const teamSummary = useMemo(() => {
    const counts = {};
    normalizedTasks.forEach((task) => {
      const assigned = task.assignedUser || 'Sin asignar';
      counts[assigned] = (counts[assigned] || 0) + 1;
    });
    return Object.entries(counts).slice(0, 6);
  }, [normalizedTasks]);

  const completionRate = metrics.total ? Math.round((metrics.completed / metrics.total) * 100) : 0;
  const totalRealHours = normalizedTasks.reduce((sum, task) => sum + (parseFloat(task.realHours) || 0), 0);
  const recentTasks = filteredAndSortedTasks.slice(0, 5);

  const tabStyle = (tab) => ({
    padding: '11px 18px',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: activeSection === tab ? 700 : 600,
    background: activeSection === tab ? 'linear-gradient(135deg, #7c6af7 0%, #00d18c 100%)' : 'transparent',
    color: activeSection === tab ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  });

  return (
    <WorkspaceShell
      title="Admin Dashboard"
      roleLabel="Admin Dashboard"
      user={user}
      onLogout={logout}
      navItems={navItems}
      activeNav={activeSection}
      accent="emerald"
      variant="admin-command"
    >
      <section className="page-hero admin-command-hero">
        <div>
          <h1 className="page-title">¡Bienvenido, {user?.name || 'Admin'}!</h1>
          <p className="page-subtitle">
            Resumen general del estado de tareas y equipos.
          </p>
        </div>
      </section>

      {error && (
        <section className="error-banner" role="alert">
          <strong>Error al procesar la solicitud.</strong>
          <span>{error.message}</span>
        </section>
      )}

      <SummaryCards metrics={metrics} items={summaryItems} />

      <div className="segmented-control">
        <button type="button" style={tabStyle('overview')} onClick={() => setActiveSection('overview')}>
          <DashboardRoundedIcon fontSize="small" />
          Resumen
        </button>
        <button type="button" style={tabStyle('tasks')} onClick={() => setActiveSection('tasks')}>
          <ChecklistRoundedIcon fontSize="small" />
          Tareas
        </button>
        <button type="button" style={tabStyle('kpis')} onClick={() => setActiveSection('kpis')}>
          <InsightsRoundedIcon fontSize="small" />
          Indicadores KPI
        </button>
      </div>

      {activeSection === 'overview' && (
        <>
          <AIGeneratedInsightPanel
            title={coquiInsight.title}
            subtitle={coquiInsight.subtitle}
            tone="emerald"
            bullets={coquiInsight.bullets || []}
          />

          <section className="admin-dashboard-grid">
            <MiniBarChart tasks={normalizedTasks} />
            <MiniLineChart tasks={normalizedTasks} />
          </section>

          <section className="admin-lower-grid">
            <article className="admin-table-card">
              <div className="panel-header">
                <div>
                  <h2>Tareas Recientes</h2>
                  <p>Últimas tareas por fecha de creación</p>
                </div>
                <button type="button" className="secondary-button" onClick={() => setActiveSection('tasks')}>Ver todas</button>
              </div>
              <TaskTable
                tasks={recentTasks}
                onToggleDone={toggleDone}
                onDelete={deleteItem}
                onOpenDetails={openTaskDetails}
                onEdit={setEditingTask}
              />
            </article>
            <ActivityFeed tasks={normalizedTasks} />
          </section>

          <section className="admin-quick-actions">
            <button type="button" className="admin-create-card" onClick={() => setActiveSection('tasks')}>
              <span><AddTaskRoundedIcon fontSize="small" /></span>
              <strong>Crear Nueva Tarea</strong>
              <small>Agrega una nueva tarea al backlog</small>
            </button>
            <div className="admin-mini-stat"><GroupsRoundedIcon fontSize="small" /><strong>{developerOptions.length - 1}</strong><span>Desarrolladores</span></div>
            <div className="admin-mini-stat"><FlagRoundedIcon fontSize="small" /><strong>{sprintSummary.length}</strong><span>Sprints activos</span></div>
            <div className="admin-mini-stat"><DoneAllRoundedIcon fontSize="small" /><strong>{completionRate}%</strong><span>Tareas completadas</span></div>
            <div className="admin-mini-stat"><AccessTimeRoundedIcon fontSize="small" /><strong>{totalRealHours}h</strong><span>Horas registradas</span></div>
          </section>
        </>
      )}

      {activeSection === 'tasks' && (
        <>
          <section className="panel-surface" style={{ marginBottom: '16px' }}>
            <div className="search-bar-shell">
              <SearchRoundedIcon fontSize="small" />
              <input
                type="text"
                value={filters.idSearch}
                onChange={(event) => handleFilterChange('idSearch', event.target.value)}
                placeholder="Buscar por ID, título o asignado..."
                className="ghost-search-input"
              />
            </div>
          </section>

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
              onOpenDetails={openTaskDetails}
              onEdit={setEditingTask}
            />
          )}

          <TeamChannel />
        </>
      )}

      {activeSection === 'kpis' && <KPIDashboard tasks={normalizedTasks} />}

      {activeSection === 'teams' && <TeamSummarySection title="Equipos" teamSummary={teamSummary} />}

      {activeSection === 'users' && <TeamSummarySection title="Usuarios" teamSummary={teamSummary} />}

      {activeSection === 'calendar' && <AdminCalendarView tasks={filteredAndSortedTasks} />}

      {activeSection === 'sprints' && (
        <section className="panel-surface">
          <div className="panel-header"><div><h2>Sprints</h2><p>Distribución de trabajo</p></div></div>
          <div className="deadline-list">
            {sprintSummary.map(([sprint, count]) => (
              <div key={sprint} className="deadline-item">
                <strong>{sprint}</strong>
                <span>{count} tareas</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeSection === 'settings' && (
        <section className="panel-surface">
          <div className="panel-header"><div><h2>Configuración</h2><p>Ajustes base del dashboard</p></div></div>
          <div className="activity-list">
            <div className="deadline-item"><strong>Vista actual</strong><span>Admin Dashboard</span></div>
            <div className="deadline-item"><strong>Modo de sesión</strong><span>Mock / desarrollo</span></div>
            <div className="deadline-item"><strong>Fuente de datos</strong><span>{normalizedTasks.length} tareas cargadas</span></div>
          </div>
        </section>
      )}

      <TaskDetailDrawer
        open={isTaskDetailOpen}
        onClose={closeTaskDetails}
        task={selectedTask}
      />
      <TaskEditModal
        open={Boolean(editingTask)}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={updateItem}
        isSaving={isUpdating}
      />
    </WorkspaceShell>
  );
}

export default AdminDashboard;
