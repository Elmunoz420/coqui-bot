import React from 'react';

const PRIORITY_CLASS_MAP = {
  alta: 'high',
  high: 'high',
  media: 'medium',
  medium: 'medium',
  baja: 'low',
  low: 'low'
};

function normalizePriority(priority) {
  return (priority || 'media').toLowerCase().trim();
}

function PriorityBadge({ priority }) {
  const normalized = normalizePriority(priority);
  const cssTone = PRIORITY_CLASS_MAP[normalized] || 'medium';
  return <span className={`badge priority ${cssTone}`}>{normalized}</span>;
}

export default PriorityBadge;
