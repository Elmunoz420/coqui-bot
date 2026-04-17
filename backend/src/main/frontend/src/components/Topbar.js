import React from 'react';

function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-container">
        <div className="topbar-brand">
          <div className="brand-icon">🐸</div>
          <div>
            <div className="brand-name">COQUI BOT</div>
            <div className="brand-tagline">Panel de Operaciones de Tareas</div>
          </div>
        </div>
        <div className="topbar-meta">
          <div className="meta-item">
            <span className="meta-label">Telegram</span>
            <span className="meta-value meta-connected">● Conectado</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
