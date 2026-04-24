import React, { useMemo, useState } from 'react';
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
import SummaryCards from '../components/SummaryCards';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import useAuth from '../app/auth/useAuth';
import useTaskWorkspace, { buildMetrics, filterTasksForUser } from '../features/tasks/useTaskWorkspace';
import API_LIST from '../API';
import WorkspaceShell from '../components/layout/WorkspaceShell';

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
    >
      {error && (
        <section className="error-banner" role="alert">
          <strong>Error al procesar la solicitud.</strong>
          <span>{error.message}</span>
        </section>
      )}

      <section className="page-hero">
        <div>
          <h1 className="page-title">Hola {user.name.split(' ')[0]}, este es tu workspace 👋</h1>
          <p className="page-subtitle">
            Revisa tus tareas asignadas, sigue tu progreso del sprint y completa el trabajo sin ruido.
          </p>
        </div>
        <div className="progress-callout">
          <div className="progress-ring">{completedPercent}%</div>
          <div>
            <strong>Progreso del sprint</strong>
            <p>{personalMetrics.completed} de {personalMetrics.total} tareas completadas</p>
            <div className="progress-track">
              <div className="progress-fill violet" style={{ width: `${completedPercent}%` }} />
            </div>
          </div>
        </div>
      </section>

      <SummaryCards metrics={personalMetrics} items={summaryItems} />

      {activeSection === 'overview' && (
        <section className="developer-grid">
          <article className="panel-surface">
            <div className="panel-header">
              <div>
                <h2>Mis tareas</h2>
                <p>{activeSprint}</p>
              </div>
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

          <div className="developer-side-column">
            <article className="panel-surface">
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

            <article className="panel-surface">
              <div className="panel-header">
                <div>
                  <h2>Próximos vencimientos</h2>
                  <p>Prioriza lo urgente</p>
                </div>
              </div>
              <div className="deadline-list">
                {upcomingDeadlines.map((task) => (
                  <div key={task.id} className="deadline-item">
                    <strong>{task.title}</strong>
                    <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-MX') : 'Sin fecha'}</span>
                  </div>
                ))}
                {!upcomingDeadlines.length && <p style={{ color: 'var(--text-secondary)' }}>No tienes vencimientos próximos.</p>}
              </div>
            </article>

            <article className="panel-surface compact">
              <div className="mini-kpi-row">
                <div>
                  <strong>{Math.round(totalHours)}h</strong>
                  <span>Horas registradas</span>
                </div>
                <AccessTimeRoundedIcon fontSize="small" />
              </div>
            </article>
          </div>
        </section>
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
        <section className="panel-surface">
          <div className="panel-header"><div><h2>Calendario</h2><p>Fechas importantes de tus tareas</p></div></div>
          <div className="deadline-list">
            {upcomingDeadlines.map((task) => (
              <div key={task.id} className="deadline-item">
                <strong>{task.title}</strong>
                <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-MX') : 'Sin fecha'}</span>
              </div>
            ))}
          </div>
        </section>
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
