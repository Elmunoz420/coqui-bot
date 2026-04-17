import React from 'react';

function SummaryCards({ metrics }) {
  const cards = [
    { key: 'total',     label: 'Total de Tareas',      tone: 'neutral' },
    { key: 'active',    label: 'Tareas Activas',        tone: 'info' },
    { key: 'completed', label: 'Tareas Completadas',    tone: 'success' },
    { key: 'overdue',   label: 'Tareas Vencidas',       tone: 'danger' },
  ];

  return (
    <section className="summary-grid" aria-label="Resumen de tareas">
      {cards.map((card) => (
        <article key={card.key} className={`summary-card ${card.tone}`}>
          <p className="summary-label">{card.label}</p>
          <p className="summary-value">{metrics[card.key]}</p>
        </article>
      ))}
    </section>
  );
}

export default SummaryCards;