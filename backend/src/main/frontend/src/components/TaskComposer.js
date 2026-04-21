import React, { useState } from 'react';

const MIEMBROS = [
  { id: 'joaquin',   name: 'Joaquín Hiroki',       role: 'Backend / AI' },
  { id: 'esteban',   name: 'Esteban Muñoz',         role: 'PM / Bot' },
  { id: 'juanpablo', name: 'Juan Pablo Buenrostro', role: 'DevOps / OCI' },
  { id: 'fernanda',  name: 'Fernanda Jiménez',      role: 'Frontend / QA' },
  { id: 'emilio',    name: 'Emilio Pardo',           role: 'Product Owner' },
];

const SPRINTS = ['Sprint 0', 'Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5'];

function generarTaskId(sprint, tareasExistentes) {
  const sprintNum = sprint.replace('Sprint ', '');
  const tareasEnSprint = tareasExistentes.filter(t => {
    if (t.sprint != null) return `Sprint ${t.sprint}` === sprint;
    return (t.descripcion || '').toLowerCase().includes(sprint.toLowerCase());
  });
  const siguiente = String(tareasEnSprint.length + 1).padStart(3, '0');
  return `S${sprintNum}-${siguiente}`;
}

function TaskComposer({ onAddItem, isInserting, existingTasks = [] }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [sprint, setSprint] = useState('Sprint 1');
  const [fechaLimite, setFechaLimite] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState('');
  const [asignados, setAsignados] = useState([]);

  const previewId = generarTaskId(sprint, existingTasks);

  function toggleMiembro(id) {
    setAsignados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!titulo.trim() || isInserting) return;

    const nombresAsignados = MIEMBROS
      .filter(m => asignados.includes(m.id))
      .map(m => m.name)
      .join(', ');

    const taskId = generarTaskId(sprint, existingTasks);

    const payload = {
      titulo: titulo.trim(),
      description: titulo.trim(),
      descripcion: descripcion.trim() || titulo.trim(),
      prioridad,
      sprint: parseInt(sprint.replace('Sprint ', ''), 10),
      taskId,
      fechaLimite: fechaLimite ? `${fechaLimite}T18:00:00Z` : null,
      horasEstimadas: horasEstimadas ? parseFloat(horasEstimadas) : 0,
      horasReales: 0,
      done: false,
      assignedUser: nombresAsignados || 'Sin asignar',
    };

    onAddItem(payload);
    setTitulo('');
    setDescripcion('');
    setPrioridad('media');
    setFechaLimite('');
    setHorasEstimadas('');
    setAsignados([]);
  }

  return (
    <section className="composer-panel" aria-label="Crear tarea">
      <form onSubmit={handleSubmit} className="composer-form">

        {/* Preview ID */}
        <div style={{ gridColumn: '1 / -1', marginBottom: '2px' }}>
          <span style={{
            fontSize: '0.78rem', color: 'var(--text-tertiary)',
            background: 'var(--bg-raised-3)', padding: '3px 12px',
            borderRadius: '12px', fontFamily: 'monospace', fontWeight: 700,
            letterSpacing: '0.05em'
          }}>
            ID de tarea: <span style={{ color: 'var(--color-accent)' }}>{previewId}</span>
          </span>
        </div>

        <div className="field search-field">
          <label htmlFor="tituloInput">Título de tarea *</label>
          <input
            id="tituloInput"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Nombre de la tarea"
            autoComplete="off"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="descripcionInput">Descripción</label>
          <input
            id="descripcionInput"
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Detalles opcionales"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="sprintInput">Sprint</label>
          <select id="sprintInput" value={sprint} onChange={(e) => setSprint(e.target.value)}>
            {SPRINTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor="prioridadInput">Prioridad</label>
          <select id="prioridadInput" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="fechaInput">Fecha límite</label>
          <input
            id="fechaInput"
            type="date"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <div className="field">
          <label htmlFor="horasInput">Horas estimadas</label>
          <input
            id="horasInput"
            type="number"
            value={horasEstimadas}
            onChange={(e) => setHorasEstimadas(e.target.value)}
            placeholder="0"
            min="0"
            step="0.5"
          />
        </div>

        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Asignar a</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
            {MIEMBROS.map((m) => {
              const sel = asignados.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMiembro(m.id)}
                  style={{
                    padding: '7px 16px', borderRadius: '20px',
                    border: sel ? '1px solid var(--color-success)' : '1px solid var(--border-default)',
                    background: sel ? 'var(--color-success-bg)' : 'var(--bg-raised-2)',
                    color: sel ? 'var(--color-success)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.85rem',
                    fontWeight: sel ? 700 : 400, transition: 'all 0.15s ease',
                  }}
                >
                  {sel ? '✓ ' : ''}{m.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
          {asignados.length > 0 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
              Asignado a: {MIEMBROS.filter(m => asignados.includes(m.id)).map(m => m.name).join(', ')}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="primary-button"
          disabled={isInserting}
          style={{ gridColumn: '1 / -1' }}
        >
          {isInserting ? 'Agregando...' : `AGREGAR TAREA — ${previewId}`}
        </button>
      </form>
    </section>
  );
}

export default TaskComposer;