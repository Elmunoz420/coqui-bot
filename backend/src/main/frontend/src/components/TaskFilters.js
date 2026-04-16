import React from 'react';

function TaskFilters({
  filters,
  onChange,
  projectOptions,
  statusOptions,
  priorityOptions,
  onReset
}) {
  return (
    <section className="filters-panel" aria-label="Task filters">
      <div className="field search-field">
        <label htmlFor="taskSearch">Search</label>
        <input
          id="taskSearch"
          type="text"
          value={filters.search}
          onChange={(event) => onChange('search', event.target.value)}
          placeholder="Search by title or description"
        />
      </div>

      <div className="field">
        <label htmlFor="projectFilter">Project</label>
        <select
          id="projectFilter"
          value={filters.project}
          onChange={(event) => onChange('project', event.target.value)}
        >
          {projectOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="statusFilter">Status</label>
        <select
          id="statusFilter"
          value={filters.status}
          onChange={(event) => onChange('status', event.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="priorityFilter">Priority</label>
        <select
          id="priorityFilter"
          value={filters.priority}
          onChange={(event) => onChange('priority', event.target.value)}
        >
          {priorityOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <button type="button" className="secondary-button" onClick={onReset}>
        Reset filters
      </button>
    </section>
  );
}

export default TaskFilters;
