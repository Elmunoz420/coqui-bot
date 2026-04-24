import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ModalHoras({ tarea, onConfirmar, onCancelar }) {
  const [horas, setHoras] = useState('');
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'var(--surface-secondary)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', padding: '1.75rem', width: '340px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}>
          Marcar como completada
        </h3>
        {tarea.taskId && (
          <span style={{
            fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--color-accent)',
            background: 'var(--color-accent-bg)', padding: '2px 10px',
            borderRadius: '12px', display: 'inline-block', marginBottom: '10px'
          }}>
            {tarea.taskId}
          </span>
        )}
        <p style={{ margin: '0 0 1.1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          "{tarea.title}"
        </p>
        <label style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
          ¿Cuántas horas tomó?
        </label>
        <input
          type="number" min="0" step="0.5" value={horas}
          onChange={(e) => setHoras(e.target.value)}
          placeholder="Ej. 2.5" autoFocus
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)', background: 'var(--bg-raised-2)',
            color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '1.2rem',
            boxSizing: 'border-box', colorScheme: 'dark', fontFamily: 'var(--font-base)'
          }}
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancelar} style={{
            padding: '9px 20px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600
          }}>Cancelar</button>
          <button type="button" onClick={() => onConfirmar(horas ? parseFloat(horas) : null)} style={{
            padding: '9px 20px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-success)',
            color: '#000', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700
          }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

function TaskTable({ tasks, onToggleDone, onDelete, onOpenDetails, hideDeleteAction = false }) {
  const [modalTarea, setModalTarea] = useState(null);

  function handleDoneClick(event, task) {
    event.preventDefault();
    if (!task.done) setModalTarea(task);
    else onToggleDone(event, task.id, task.rawDescription, false, null);
  }

  function handleHorasConfirmar(horas) {
    onToggleDone({ preventDefault: () => {} }, modalTarea.id, modalTarea.rawDescription, true, horas);
    setModalTarea(null);
  }

  if (!tasks.length) {
    return (
      <div className="empty-state" role="status">
        <h3>No se encontraron tareas</h3>
        <p>Ajusta los filtros o crea una nueva tarea.</p>
      </div>
    );
  }

  return (
    <>
      {modalTarea && (
        <ModalHoras tarea={modalTarea} onConfirmar={handleHorasConfirmar} onCancelar={() => setModalTarea(null)} />
      )}
      <div className="table-wrapper">
        <table className="tasks-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tarea</th>
              <th>Sprint</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Asignado a</th>
              <th>Hrs. Est.</th>
              <th>Hrs. Reales</th>
              <th>Fecha Límite</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>
                  {task.taskId ? (
                    <span style={{
                      fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700,
                      color: 'var(--color-accent)', background: 'var(--color-accent-bg)',
                      padding: '3px 9px', borderRadius: '12px', whiteSpace: 'nowrap'
                    }}>
                      {task.taskId}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-placeholder)', fontSize: '0.78rem' }}>#{task.id}</span>
                  )}
                </td>
                <td>
                  <button type="button" className="text-link" onClick={() => onOpenDetails(task)}>
                    {task.title}
                  </button>
                  {task.description && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                      {task.description.substring(0, 50)}{task.description.length > 50 ? '…' : ''}
                    </div>
                  )}
                </td>
                <td>
                  {task.sprint
                    ? <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{task.sprint}</span>
                    : <span style={{ color: 'var(--text-placeholder)' }}>—</span>}
                </td>
                <td><PriorityBadge priority={task.priority} /></td>
                <td><StatusBadge status={task.status} done={task.done} /></td>
                <td>
                  {task.assignedUser && task.assignedUser !== 'coqui_bot_user' && task.assignedUser !== 'Sin asignar'
                    ? (
                      <span style={{
                        fontSize: '0.82rem', color: 'var(--color-accent)',
                        background: 'var(--color-accent-bg)', padding: '3px 10px',
                        borderRadius: '12px', whiteSpace: 'nowrap'
                      }}>
                        {task.assignedUser.split(',').map(n => n.trim().split(' ')[0]).join(', ')}
                      </span>
                    )
                    : <span style={{ color: 'var(--text-placeholder)', fontSize: '0.82rem' }}>—</span>
                  }
                </td>
                <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  {task.estimatedHours !== 'N/A' && task.estimatedHours !== null ? `${task.estimatedHours}h` : '—'}
                </td>
                <td style={{ fontSize: '0.88rem', fontWeight: 600, color: task.realHours && task.realHours !== 'N/A' && task.realHours !== 0 ? 'var(--color-success)' : 'var(--text-placeholder)' }}>
                  {task.realHours && task.realHours !== 'N/A' && task.realHours !== 0 ? `${task.realHours}h` : '—'}
                </td>
                <td style={{ fontSize: '0.88rem' }}>{formatDate(task.dueDate)}</td>
                <td>
                  <div className="actions-cell">
                    <button type="button" className="secondary-button" onClick={(e) => handleDoneClick(e, task)}>
                      {task.done ? 'Reabrir' : 'Completar'}
                    </button>
                    {!hideDeleteAction && (
                      <button type="button" className="danger-button" onClick={() => onDelete(task.id)}>
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default TaskTable;
