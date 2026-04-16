import React from 'react';

function AISuggestionCard({ suggestions }) {
  return (
    <section className="panel ai-panel" aria-label="AI suggestions">
      <h3>AI Suggestions</h3>
      {!suggestions.length && (
        <p className="muted">No SUGERENCIA_IA endpoint is currently exposed to the frontend.</p>
      )}
      <ul className="insights-list">
        {suggestions.map((suggestion) => (
          <li key={suggestion.id}>
            <p className="insight-title">{suggestion.type}</p>
            <p>{suggestion.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default AISuggestionCard;
