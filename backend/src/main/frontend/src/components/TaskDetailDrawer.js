import React, { useEffect, useState } from 'react';
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

function TaskDetailDrawer({ open, onClose, task, onSaveTask, canEdit = false, developerOptions = [] }) {
  const [isEditing, setEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', assignedUser: '', estimatedHours: '' });

  useEffect(() => {
    if (!task) return;
    setForm({
      title: task.title || '',
      assignedUser: task.assignedUser || 'Sin asignar',
      estimatedHours: task.estimatedHours === 'N/A' || task.estimatedHours == null ? '' : String(task.estimatedHours),
    });
    setEditing(false);
    setSaving(false);
  }, [task]);

  if (!task) {
    return null;
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCancelEdit() {
    setEditing(false);
    setForm({
      title: task.title || '',
      assignedUser: task.assignedUser || 'Sin asignar',
      estimatedHours: task.estimatedHours === 'N/A' || task.estimatedHours == null ? '' : String(task.estimatedHours),
    });
  }

  function handleSave() {
    if (!onSaveTask) {
      setEditing(false);
      return;
    }
    setSaving(true);
    onSaveTask(task.id, form)
      .then(() => {
        setEditing(false);
      })
      .finally(() => {
        setSaving(false);
      });
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <aside className="task-drawer">
        <header className="task-drawer-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
            <div>
              <h2>{task.title}</h2>
              {task.description && <p>{task.description}</p>}
            </div>
            {canEdit && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => (isEditing ? handleCancelEdit() : setEditing(true))}
              >
                {isEditing ? 'Cancelar' : 'Editar'}
              </button>
            )}
          </div>
        </header>

        <section className="panel">
          <h3>{isEditing ? 'Editar tarea' : 'Task Details'}</h3>
          {isEditing ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div className="field">
                <label htmlFor="taskTitleInput">Task name</label>
                <input
                  id="taskTitleInput"
                  type="text"
                  value={form.title}
                  onChange={(event) => handleChange('title', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="taskDeveloperInput">Developer name</label>
                <select
                  id="taskDeveloperInput"
                  value={form.assignedUser}
                  onChange={(event) => handleChange('assignedUser', event.target.value)}
                >
                  {[form.assignedUser, ...developerOptions]
                    .filter((value, index, array) => value && array.indexOf(value) === index)
                    .map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="taskHoursInput">Estimated hours</label>
                <input
                  id="taskHoursInput"
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.estimatedHours}
                  onChange={(event) => handleChange('estimatedHours', event.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button type="button" className="secondary-button" onClick={handleCancelEdit}>
                  Cancelar
                </button>
                <button type="button" className="primary-button" onClick={handleSave} disabled={isSaving || !form.title.trim()}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <MetaRow label="Status" value={<StatusBadge status={task.status} done={task.done} />} />
              <MetaRow label="Priority" value={<PriorityBadge priority={task.priority} />} />
              <MetaRow label="Assigned user" value={task.assignedUser} />
              <MetaRow label="Project" value={task.project} />
              <MetaRow label="Due date" value={formatDate(task.dueDate)} />
              <MetaRow label="Created" value={formatDate(task.createdAt)} />
              <MetaRow label="Estimated hours" value={task.estimatedHours} />
              <MetaRow label="Real hours" value={task.realHours} />
            </>
          )}
        </section>

        <TimelineSection events={task.history} />
        <AISuggestionCard suggestions={task.aiSuggestions} />
      </aside>
    </Drawer>
  );
}

export default TaskDetailDrawer;
