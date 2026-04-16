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

function TimelineSection({ events }) {
  return (
    <section className="panel timeline-panel" aria-label="Task timeline">
      <h3>Task History</h3>
      {!events.length && <p className="muted">No history records returned by the current API.</p>}
      <ul className="timeline-list">
        {events.map((event) => (
          <li key={event.id} className="timeline-item">
            <p className="timeline-title">{event.title}</p>
            <p className="timeline-meta">{formatDate(event.date)}</p>
            {event.comment && <p className="timeline-comment">{event.comment}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TimelineSection;
