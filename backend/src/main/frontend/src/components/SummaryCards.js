import React from 'react';

function SummaryCards({ metrics }) {
  const cards = [
    { key: 'total', label: 'Total Tasks', tone: 'neutral' },
    { key: 'active', label: 'Active Tasks', tone: 'info' },
    { key: 'completed', label: 'Completed Tasks', tone: 'success' },
    { key: 'overdue', label: 'Overdue Tasks', tone: 'danger' }
  ];

  return (
    <section className="summary-grid" aria-label="Task summary metrics">
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
