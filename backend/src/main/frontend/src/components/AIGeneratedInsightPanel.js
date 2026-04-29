import React from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';

function AIGeneratedInsightPanel({ title, subtitle, bullets = [], tone = 'emerald' }) {
  return (
    <section className={`ai-insight-panel tone-${tone}`} aria-label={title}>
      <div className="ai-insight-heading">
        <span className="ai-insight-icon"><AutoAwesomeRoundedIcon fontSize="small" /></span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="ai-insight-content">
        {bullets.map((item) => (
          <div key={item.label} className="ai-insight-row">
            <strong>{item.label}</strong>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
      <div className="ai-insight-footer">
        Espacio reservado para conectar recomendaciones generadas por IA.
      </div>
    </section>
  );
}

export default AIGeneratedInsightPanel;
