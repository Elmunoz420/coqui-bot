import React from 'react';

const SPRINT_OPTIONS = ['Todos', 'Sprint 0', 'Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5'];

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Más recientes primero' },
  { value: 'createdAt_asc',  label: 'Más antiguos primero' },
  { value: 'priority_desc',  label: 'Prioridad (alta → baja)' },
  { value: 'priority_asc',   label: 'Prioridad (baja → alta)' },
  { value: 'title_asc',      label: 'Título A→Z' },
  { value: 'title_desc',     label: 'Título Z→A' },
  { value: 'estimatedHours_desc', label: 'Horas estimadas (mayor)' },
  { value: 'estimatedHours_asc',  label: 'Horas estimadas (menor)' },
];

function translateOption(opt) {
  const map = { All: 'Todos', completada: 'Completada', pendiente: 'Pendiente', alta: 'Alta', media: 'Media', baja: 'Baja' };
  return map[opt] || opt;
}

function TaskFilters({ filters, onChange, statusOptions, priorityOptions, developerOptions, onReset }) {
  return (
    <section className="filters-panel" aria-label="Filtros de tareas">
      <div className="field search-field">
        <label htmlFor="taskSearch">Buscar</label>
        <input
          id="taskSearch"
          type="text"
          value={filters.search}
          onChange={(e) => onChange('search', e.target.value)}
          placeholder="Buscar por título o descripción"
        />
      </div>

      <div className="field">
        <label htmlFor="sprintFilter">Sprint</label>
        <select id="sprintFilter" value={filters.sprint} onChange={(e) => onChange('sprint', e.target.value)}>
          {SPRINT_OPTIONS.map((opt) => (
            <option key={opt} value={opt === 'Todos' ? 'All' : opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="statusFilter">Estado</label>
        <select id="statusFilter" value={filters.status} onChange={(e) => onChange('status', e.target.value)}>
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>{translateOption(opt)}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="priorityFilter">Prioridad</label>
        <select id="priorityFilter" value={filters.priority} onChange={(e) => onChange('priority', e.target.value)}>
          {priorityOptions.map((opt) => (
            <option key={opt} value={opt}>{translateOption(opt)}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="developerFilter">Desarrollador</label>
        <select id="developerFilter" value={filters.developer} onChange={(e) => onChange('developer', e.target.value)}>
          {(developerOptions || ['All']).map((opt) => (
            <option key={opt} value={opt}>{opt === 'All' ? 'Todos' : opt}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="sortFilter">Ordenar por</label>
        <select id="sortFilter" value={filters.sort} onChange={(e) => onChange('sort', e.target.value)}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <button type="button" className="secondary-button" onClick={onReset}>
        Limpiar filtros
      </button>
    </section>
  );
}

export default TaskFilters;