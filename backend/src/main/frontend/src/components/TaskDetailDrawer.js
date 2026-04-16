import React from 'react';
import { Drawer } from '@mui/material';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import TimelineSection from './TimelineSection';
import AISuggestionCard from './AISuggestionCard';

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

function MetaRow({ label, value }) {
  return (
    <div className="meta-row">
      <span>{label}</span>
      <strong>{value || 'N/A'}</strong>
    </div>
  );
}

function TaskDetailDrawer({ open, onClose, task }) {
  if (!task) {
    return null;
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <aside className="task-drawer">
        <header className="task-drawer-header">
          <h2>{task.title}</h2>
          {task.description && <p>{task.description}</p>}
        </header>

        <section className="panel">
          <h3>Task Details</h3>
          <MetaRow label="Status" value={<StatusBadge status={task.status} done={task.done} />} />
          <MetaRow label="Priority" value={<PriorityBadge priority={task.priority} />} />
          <MetaRow label="Assigned user" value={task.assignedUser} />
          <MetaRow label="Project" value={task.project} />
          <MetaRow label="Due date" value={formatDate(task.dueDate)} />
          <MetaRow label="Created" value={formatDate(task.createdAt)} />
          <MetaRow label="Estimated hours" value={task.estimatedHours} />
          <MetaRow label="Real hours" value={task.realHours} />
        </section>

        <TimelineSection events={task.history} />
        <AISuggestionCard suggestions={task.aiSuggestions} />
      </aside>
    </Drawer>
  );
}

export default TaskDetailDrawer;
