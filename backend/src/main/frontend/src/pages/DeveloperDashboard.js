import React, { useEffect, useMemo, useRef, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import SummaryCards from '../components/SummaryCards';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import useAuth from '../app/auth/useAuth';
import useTaskWorkspace, { buildMetrics, filterTasksForUser } from '../features/tasks/useTaskWorkspace';
import API_LIST from '../API';
import WorkspaceShell from '../components/layout/WorkspaceShell';

function toDateKey(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
}

function PersonalCalendarView({ tasks, onOpenTask }) {
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
    <section className="admin-calendar-card dev-calendar-card">
      <div className="panel-header">
        <div>
          <h2>Calendario</h2>
          <p>Fechas límite de tus tareas asignadas.</p>
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
                        <button key={task.id} type="button" className={`admin-calendar-task priority-${task.priority}`} onClick={() => onOpenTask(task)}>
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

function DeveloperDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const { user, logout } = useAuth();
  const {
    isLoading,
    error,
    activityLog,
    normalizedTasks,
    selectedTask,
    isTaskDetailOpen,
    openTaskDetails,
    closeTaskDetails,
  } = useTaskWorkspace({
    endpoint: `${API_LIST}/my?username=${encodeURIComponent(user.username)}`,
  });

  const personalTasks = useMemo(() => filterTasksForUser(normalizedTasks, user), [normalizedTasks, user]);
  const personalTaskIds = useMemo(() => new Set(personalTasks.map((task) => String(task.id))), [personalTasks]);

  const visibleTasks = useMemo(() => personalTasks, [personalTasks]);

  const personalMetrics = useMemo(() => buildMetrics(personalTasks), [personalTasks]);
  const completedPercent = personalMetrics.total ? Math.round((personalMetrics.completed / personalMetrics.total) * 100) : 0;
  const totalHours = useMemo(
    () => personalTasks.reduce((sum, task) => sum + (parseFloat(task.realHours) || 0), 0),
    [personalTasks]
  );
  const activeSprint = useMemo(() => personalTasks.find((task) => task.sprint)?.sprint || 'Sprint 1', [personalTasks]);
  const recentActivity = useMemo(
    () => activityLog.filter((entry) => !entry.taskId || personalTaskIds.has(String(entry.taskId))).slice(0, 5),
    [activityLog, personalTaskIds]
  );
  const upcomingDeadlines = useMemo(
    () => [...personalTasks]
      .filter((task) => task.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3),
    [personalTasks]
  );
  const nextDeadline = upcomingDeadlines[0];
  const activeTasks = useMemo(() => personalTasks.filter((task) => !task.done), [personalTasks]);

  const summaryItems = [
    { key: 'total', label: 'Mis tareas', tone: 'neutral', helper: `Asignadas a ti`, icon: <ChecklistRoundedIcon fontSize="small" /> },
    { key: 'active', label: 'En progreso', tone: 'info', helper: 'Trabajando en ellas', icon: <PendingActionsRoundedIcon fontSize="small" /> },
    { key: 'completed', label: 'Completadas', tone: 'success', helper: 'Buen trabajo', icon: <TaskAltRoundedIcon fontSize="small" /> },
    { key: 'overdue', label: 'Vencidas', tone: 'danger', helper: 'Vas al día', icon: <WarningAmberRoundedIcon fontSize="small" /> },
  ];

  const navItems = [
    { id: 'overview', label: 'Resumen', icon: DashboardRoundedIcon, onClick: () => setActiveSection('overview') },
    { id: 'tasks', label: 'Mis tareas', icon: ChecklistRoundedIcon, onClick: () => setActiveSection('tasks') },
    { id: 'calendar', label: 'Calendario', icon: CalendarMonthRoundedIcon, onClick: () => setActiveSection('calendar') },
    { id: 'activity', label: 'Actividad', icon: HistoryRoundedIcon, onClick: () => setActiveSection('activity') },
    { id: 'reports', label: 'Reportes', icon: AssessmentRoundedIcon, onClick: () => setActiveSection('reports') },
  ];

  return (
    <WorkspaceShell
      title="Developer Workspace"
      roleLabel="Developer Workspace"
      user={user}
      onLogout={logout}
      navItems={navItems}
      activeNav={activeSection}
      accent="violet"
      variant="admin-command developer-command"
    >
      {error && (
        <section className="error-banner" role="alert">
          <strong>Error al procesar la solicitud.</strong>
          <span>{error.message}</span>
        </section>
      )}

      <section className="page-hero dev-command-hero">
        <div>
          <h1 className="page-title">Hola {user.name.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">
            Aquí tienes tus tareas, próximos vencimientos y progreso del día.
          </p>
        </div>
        <div className="dev-focus-card">
          <div className="progress-ring">{completedPercent}%</div>
          <div>
            <span>{activeSprint}</span>
            <strong>Progreso personal</strong>
            <p>{personalMetrics.completed} de {personalMetrics.total} tareas completadas</p>
            <div className="progress-track">
              <div className="progress-fill violet" style={{ width: `${completedPercent}%` }} />
            </div>
          </div>
        </div>
      </section>

      <SummaryCards metrics={personalMetrics} items={summaryItems} />

      <div className="segmented-control dev-segmented-control">
        <button type="button" className={activeSection === 'overview' ? 'active' : ''} onClick={() => setActiveSection('overview')}>
          <DashboardRoundedIcon fontSize="small" />
          Resumen
        </button>
        <button type="button" className={activeSection === 'tasks' ? 'active' : ''} onClick={() => setActiveSection('tasks')}>
          <ChecklistRoundedIcon fontSize="small" />
          Mis tareas
        </button>
        <button type="button" className={activeSection === 'calendar' ? 'active' : ''} onClick={() => setActiveSection('calendar')}>
          <CalendarMonthRoundedIcon fontSize="small" />
          Calendario
        </button>
      </div>

      {activeSection === 'overview' && (
        <>
        <section className="dev-command-grid">
          <article className="dev-primary-panel">
            <div className="panel-header">
              <div>
                <h2>Foco de trabajo</h2>
                <p>{activeSprint} · {activeTasks.length} tareas activas</p>
              </div>
              <span className="admin-select-chip"><BoltRoundedIcon fontSize="small" /> En progreso</span>
            </div>
            {isLoading ? (
              <div className="loading-state" role="status">
                <CircularProgress />
                <p>Cargando tus tareas...</p>
              </div>
            ) : (
              <div className="task-list-stack">
                {visibleTasks.map((task) => (
                  <button key={task.id} type="button" className="task-list-row" onClick={() => openTaskDetails(task)}>
                    <div className="task-list-main">
                      <span className="task-list-title">{task.title}</span>
                      <span className="task-list-meta">{task.sprint || 'Sin sprint'} · {task.taskId || `#${task.id}`}</span>
                    </div>
                    <div className="task-list-side">
                      <span className={`task-pill ${task.status}`}>{task.status}</span>
                      <span className="task-list-date">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-MX') : 'Sin fecha'}</span>
                    </div>
                  </button>
                ))}
                {!visibleTasks.length && (
                  <p style={{ color: 'var(--text-secondary)' }}>No tienes tareas asignadas por el momento.</p>
                )}
                <button type="button" className="footer-link-row" onClick={() => setActiveSection('tasks')}>
                  <span>Ver todas mis tareas</span>
                  <ArrowForwardRoundedIcon fontSize="small" />
                </button>
              </div>
            )}
          </article>

          <div className="dev-side-stack">
            <article className="dev-deadline-card">
              <div className="panel-header">
                <div>
                  <h2>Siguiente entrega</h2>
                  <p>Prioridad inmediata</p>
                </div>
                <WarningAmberRoundedIcon fontSize="small" />
              </div>
              {nextDeadline ? (
                <button type="button" className="dev-next-task" onClick={() => openTaskDetails(nextDeadline)}>
                  <strong>{nextDeadline.title}</strong>
                  <span>{nextDeadline.taskId || `#${nextDeadline.id}`} · {nextDeadline.dueDate ? new Date(nextDeadline.dueDate).toLocaleDateString('es-MX') : 'Sin fecha'}</span>
                </button>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No tienes vencimientos próximos.</p>
              )}
            </article>

            <article className="dev-side-card">
              <div className="panel-header">
                <div>
                  <h2>Actividad reciente</h2>
                  <p>Últimos cambios</p>
                </div>
              </div>
              <div className="activity-list">
                {recentActivity.length ? recentActivity.map((entry) => (
                  <div key={entry.id} className="activity-item">
                    <div className="activity-icon"><HistoryRoundedIcon fontSize="small" /></div>
                    <div>
                      <strong>{entry.message}</strong>
                      <span>{new Date(entry.createdAt).toLocaleString('es-MX')}</span>
                    </div>
                  </div>
                )) : (
                  <p style={{ color: 'var(--text-secondary)' }}>Sin actividad registrada todavía.</p>
                )}
              </div>
            </article>

            <div className="dev-side-mini-grid">
              <div className="admin-mini-stat"><AccessTimeRoundedIcon fontSize="small" /><strong>{Math.round(totalHours)}h</strong><span>Horas</span></div>
              <div className="admin-mini-stat"><TaskAltRoundedIcon fontSize="small" /><strong>{completedPercent}%</strong><span>Progreso</span></div>
            </div>
          </div>
        </section>

        <section className="dev-mini-grid">
          <div className="admin-mini-stat"><PendingActionsRoundedIcon fontSize="small" /><strong>{activeTasks.length}</strong><span>Tareas activas</span></div>
          <div className="admin-mini-stat"><TaskAltRoundedIcon fontSize="small" /><strong>{personalMetrics.completed}</strong><span>Completadas</span></div>
          <div className="admin-mini-stat"><AccessTimeRoundedIcon fontSize="small" /><strong>{Math.round(totalHours)}h</strong><span>Horas registradas</span></div>
        </section>
        </>
      )}

      {activeSection === 'tasks' && (
        <section className="panel-surface">
          <div className="panel-header"><div><h2>Mis tareas</h2><p>Todas tus asignaciones actuales</p></div></div>
          <div className="task-list-stack">
            {visibleTasks.map((task) => (
              <button key={task.id} type="button" className="task-list-row" onClick={() => openTaskDetails(task)}>
                <div className="task-list-main">
                  <span className="task-list-title">{task.title}</span>
                  <span className="task-list-meta">{task.sprint || 'Sin sprint'} · {task.taskId || `#${task.id}`}</span>
                </div>
                <div className="task-list-side">
                  <span className={`task-pill ${task.status}`}>{task.status}</span>
                  <span className="task-list-date">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-MX') : 'Sin fecha'}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {activeSection === 'calendar' && (
        <PersonalCalendarView tasks={visibleTasks} onOpenTask={openTaskDetails} />
      )}

      {activeSection === 'activity' && (
        <section className="panel-surface">
          <div className="panel-header"><div><h2>Actividad</h2><p>Historial reciente de tu trabajo</p></div></div>
          <div className="activity-list">
            {recentActivity.map((entry) => (
              <div key={entry.id} className="activity-item">
                <div className="activity-icon"><HistoryRoundedIcon fontSize="small" /></div>
                <div>
                  <strong>{entry.message}</strong>
                  <span>{new Date(entry.createdAt).toLocaleString('es-MX')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeSection === 'reports' && (
        <section className="panel-surface">
          <div className="panel-header"><div><h2>Reportes</h2><p>Métricas personales</p></div></div>
          <div className="activity-list">
            <div className="deadline-item"><strong>Tareas totales</strong><span>{personalMetrics.total}</span></div>
            <div className="deadline-item"><strong>Completadas</strong><span>{personalMetrics.completed}</span></div>
            <div className="deadline-item"><strong>Horas registradas</strong><span>{Math.round(totalHours)}h</span></div>
            <div className="deadline-item"><strong>Progreso sprint</strong><span>{completedPercent}%</span></div>
          </div>
        </section>
      )}

      <TaskDetailDrawer
        open={isTaskDetailOpen}
        onClose={closeTaskDetails}
        task={selectedTask}
      />
    </WorkspaceShell>
  );
}

export default DeveloperDashboard;
