import React, { useMemo, useState } from 'react';
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
import SummaryCards from '../components/SummaryCards';
import TaskFilters from '../components/TaskFilters';
import TaskComposer from '../components/TaskComposer';
import TaskTable from '../components/TaskTable';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import TeamChannel from '../components/TeamChannel';
import KPIDashboard from '../components/Kpidashboard';
import useTaskWorkspace from '../features/tasks/useTaskWorkspace';
import useAuth from '../app/auth/useAuth';
import WorkspaceShell from '../components/layout/WorkspaceShell';

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const {
    user,
    logout,
  } = useAuth();
  const {
    isLoading,
    isInserting,
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
    deleteItem,
    toggleDone,
    handleFilterChange,
    resetFilters,
    openTaskDetails,
    closeTaskDetails,
  } = useTaskWorkspace();

  const summaryItems = [
    { key: 'total', label: 'Total de tareas', tone: 'neutral', helper: 'Todas las tareas', icon: <ChecklistRoundedIcon fontSize="small" /> },
    { key: 'active', label: 'Tareas activas', tone: 'info', helper: 'En progreso', icon: <GroupsRoundedIcon fontSize="small" /> },
    { key: 'completed', label: 'Tareas completadas', tone: 'success', helper: 'Completadas', icon: <AssignmentTurnedInRoundedIcon fontSize="small" /> },
    { key: 'overdue', label: 'Tareas vencidas', tone: 'danger', helper: 'Vencidas', icon: <FlagRoundedIcon fontSize="small" /> },
  ];

  const navItems = [
    { id: 'overview', label: 'Resumen', icon: DashboardRoundedIcon, onClick: () => setActiveSection('overview') },
    { id: 'tasks', label: 'Tareas', icon: ChecklistRoundedIcon, onClick: () => setActiveSection('tasks') },
    { id: 'kpis', label: 'Indicadores KPI', icon: InsightsRoundedIcon, onClick: () => setActiveSection('kpis') },
    { id: 'teams', label: 'Equipos', icon: GroupsRoundedIcon, onClick: () => setActiveSection('teams') },
    { id: 'sprints', label: 'Sprints', icon: FlagRoundedIcon, onClick: () => setActiveSection('sprints') },
    { id: 'settings', label: 'Configuración', icon: SettingsRoundedIcon, onClick: () => setActiveSection('settings') },
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

  const tabStyle = (tab) => ({
    padding: '11px 18px',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: activeSection === tab ? 700 : 600,
    background: activeSection === tab ? 'linear-gradient(135deg, #31d59a 0%, #21b97d 100%)' : '#f4f6fb',
    color: activeSection === tab ? '#fff' : '#58637a',
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
    >
      <section className="page-hero">
        <div>
          <h1 className="page-title">Panel global del proyecto</h1>
          <p className="page-subtitle">
            Supervisa las tareas del equipo, administra asignaciones y revisa el estado general del sprint.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="soft-action-button" onClick={() => setActiveSection('tasks')}>
            <AddTaskRoundedIcon fontSize="small" />
            Nueva tarea
          </button>
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
        <section className="developer-grid">
          <article className="panel-surface">
            <div className="panel-header">
              <div>
                <h2>Estado general</h2>
                <p>Resumen operativo del tablero</p>
              </div>
            </div>
            <TaskTable
              tasks={filteredAndSortedTasks.slice(0, 5)}
              onToggleDone={toggleDone}
              onDelete={deleteItem}
              onOpenDetails={openTaskDetails}
            />
          </article>
          <div className="developer-side-column">
            <article className="panel-surface">
              <div className="panel-header"><div><h2>Equipos</h2><p>Carga por responsable</p></div></div>
              <div className="activity-list">
                {teamSummary.map(([name, count]) => (
                  <div key={name} className="deadline-item">
                    <strong>{name}</strong>
                    <span>{count} tareas</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel-surface">
              <div className="panel-header"><div><h2>Sprints</h2><p>Distribución actual</p></div></div>
              <div className="activity-list">
                {sprintSummary.map(([sprint, count]) => (
                  <div key={sprint} className="deadline-item">
                    <strong>{sprint}</strong>
                    <span>{count} tareas</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
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
            />
          )}

          <TeamChannel />
        </>
      )}

      {activeSection === 'kpis' && <KPIDashboard tasks={normalizedTasks} />}

      {activeSection === 'teams' && (
        <section className="panel-surface">
          <div className="panel-header"><div><h2>Equipos</h2><p>Visión rápida por miembro</p></div></div>
          <div className="activity-list">
            {teamSummary.map(([name, count]) => (
              <div key={name} className="activity-item">
                <div className="activity-icon"><GroupsRoundedIcon fontSize="small" /></div>
                <div><strong>{name}</strong><span>{count} tareas asignadas</span></div>
              </div>
            ))}
          </div>
        </section>
      )}

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
    </WorkspaceShell>
  );
}

export default AdminDashboard;
