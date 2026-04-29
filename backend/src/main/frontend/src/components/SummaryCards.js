import React from 'react';

function SummaryCards({ metrics, items }) {
  const cards = items || [
    { key: 'total', label: 'Total de Tareas', tone: 'neutral', helper: 'Todas las tareas' },
    { key: 'active', label: 'Tareas Activas', tone: 'info', helper: 'En progreso' },
    { key: 'completed', label: 'Tareas Completadas', tone: 'success', helper: 'Completadas' },
    { key: 'overdue', label: 'Tareas Vencidas', tone: 'danger', helper: 'Vencidas' },
  ];

  return (
    <section className="summary-grid" aria-label="Resumen de tareas">
      {cards.map((card) => (
        <article key={card.key} className={`summary-card ${card.tone}`}>
          <div className="summary-card-header">
            <div>
              <p className="summary-label">{card.label}</p>
              <p className="summary-value">{card.value ?? metrics?.[card.key] ?? 0}</p>
              {card.helper && <p className="summary-change">{card.helper}</p>}
            </div>
            {card.icon && <div className={`summary-icon ${card.tone}`}>{card.icon}</div>}
          </div>
        </article>
      ))}
    </section>
  );
}

export default SummaryCards;