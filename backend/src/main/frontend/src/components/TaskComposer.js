import React, { useState } from 'react';

function TaskComposer({ onAddItem, isInserting }) {
  const [description, setDescription] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [fechaLimite, setFechaLimite] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    if (!description.trim() || isInserting) {
      return;
    }
    const taskData = {
      description: description.trim(),
      descripcion: descripcion.trim() || description.trim(),
      prioridad: prioridad,
      fechaLimite: fechaLimite || null,
      horasEstimadas: horasEstimadas ? parseFloat(horasEstimadas) : 0,
      horasReales: 0,
      done: false
    };
    onAddItem(taskData);
    // Reset form
    setDescription('');
    setDescripcion('');
    setPrioridad('media');
    setFechaLimite('');
    setHorasEstimadas('');
  }

  return (
    <section className="composer-panel" aria-label="Create task">
      <form onSubmit={handleSubmit} className="composer-form">
        <div className="field search-field">
          <label htmlFor="newTaskInput">Task Title *</label>
          <input
            id="newTaskInput"
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Task title"
            autoComplete="off"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="newTaskDesc">Description</label>
          <input
            id="newTaskDesc"
            type="text"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            placeholder="Optional details"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="newTaskPriority">Priority</label>
          <select
            id="newTaskPriority"
            value={prioridad}
            onChange={(event) => setPrioridad(event.target.value)}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="newTaskDueDate">Due Date</label>
          <input
            id="newTaskDueDate"
            type="date"
            value={fechaLimite}
            onChange={(event) => setFechaLimite(event.target.value ? event.target.value + 'T18:00:00' : '')}
          />
        </div>

        <div className="field">
          <label htmlFor="newTaskEstHours">Est. Hours</label>
          <input
            id="newTaskEstHours"
            type="number"
            value={horasEstimadas}
            onChange={(event) => setHorasEstimadas(event.target.value)}
            placeholder="0"
            min="0"
            step="0.5"
          />
        </div>

        <button type="submit" className="primary-button" disabled={isInserting}>
          {isInserting ? 'Adding...' : 'Add task'}
        </button>
      </form>
    </section>
  );
}

export default TaskComposer;
