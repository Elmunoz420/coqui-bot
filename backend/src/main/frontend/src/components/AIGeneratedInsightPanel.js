import React from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';

function AIGeneratedInsightPanel({ title, subtitle, bullets = [], optimizationPlan = [], tone = 'emerald' }) {
  const [isPlanOpen, setIsPlanOpen] = React.useState(false);
  const hasPlan = optimizationPlan.length > 0;

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

      <div className="ai-insight-actions">
        <span>Plan generado a partir del desempeño por sprint.</span>
        {hasPlan && (
          <button
            type="button"
            className={`ai-plan-toggle ${isPlanOpen ? 'open' : ''}`}
            onClick={() => setIsPlanOpen((current) => !current)}
            aria-expanded={isPlanOpen}
          >
            <RocketLaunchRoundedIcon fontSize="small" />
            {isPlanOpen ? 'Ocultar plan' : 'Ver plan'}
            <KeyboardArrowDownRoundedIcon className="ai-plan-toggle-icon" fontSize="small" />
          </button>
        )}
      </div>

      {hasPlan && isPlanOpen && (
        <div className="ai-optimization-plan">
          {optimizationPlan.map((step, index) => (
            <article key={`${step.title}-${index}`} className="ai-plan-step">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AIGeneratedInsightPanel;
