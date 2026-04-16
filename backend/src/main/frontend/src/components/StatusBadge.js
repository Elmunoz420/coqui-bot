import React from 'react';

const STATUS_CLASS_MAP = {
  pendiente: 'pending',
  en_progreso: 'progress',
  enprogreso: 'progress',
  completada: 'done',
  done: 'done',
  cerrada: 'done'
};

function normalizeStatus(status, done) {
  if (done) {
    return 'completada';
  }
  const normalized = (status || 'pendiente').toLowerCase().replace(/\s+/g, '_');
  return normalized;
}

function StatusBadge({ status, done }) {
  const normalized = normalizeStatus(status, done);
  const cssTone = STATUS_CLASS_MAP[normalized] || 'pending';
  const label = normalized.replace(/_/g, ' ');

  return <span className={`badge status ${cssTone}`}>{label}</span>;
}

export default StatusBadge;
