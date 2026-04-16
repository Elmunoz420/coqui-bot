import React from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

function formatDate(value) {
  if (!value) {
    return 'No date';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'No date';
  }
  return parsed.toLocaleString();
}

function TaskTable({ tasks, onToggleDone, onDelete, onOpenDetails }) {
  if (!tasks.length) {
    return (
      <div className="empty-state" role="status">
        <h3>No tasks found</h3>
        <p>Adjust your filters or create a new task.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="tasks-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Description</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Est. Hours</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <button type="button" className="text-link" onClick={() => onOpenDetails(task)}>
                  {task.title}
                </button>
              </td>
              <td className="description-preview">
                {task.description ? task.description.substring(0, 50) + (task.description.length > 50 ? '...' : '') : '—'}
              </td>
              <td>
                <PriorityBadge priority={task.priority} />
              </td>
              <td>
                <StatusBadge status={task.status} done={task.done} />
              </td>
              <td>
                {task.estimatedHours !== 'N/A' ? `${task.estimatedHours}h` : '—'}
              </td>
              <td>{formatDate(task.dueDate)}</td>
              <td>
                <div className="actions-cell">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={(event) => onToggleDone(event, task.id, task.rawDescription, !task.done)}
                  >
                    {task.done ? 'Undo' : 'Done'}
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => onDelete(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TaskTable;
