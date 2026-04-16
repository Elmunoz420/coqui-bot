import React from 'react';

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

function BotActivityPanel({ activities }) {
  return (
    <section className="panel activity-panel" aria-label="Bot and app activity">
      <h3>Recent Bot Activity</h3>
      {!activities.length && (
        <p className="muted">No INTERACCION_BOT endpoint is currently exposed to this UI.</p>
      )}
      <ul className="activity-list">
        {activities.map((activity) => (
          <li key={activity.id}>
            <p className="activity-title">{activity.message}</p>
            <p className="activity-meta">{formatDate(activity.createdAt)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default BotActivityPanel;
