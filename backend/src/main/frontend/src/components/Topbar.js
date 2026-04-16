import React from 'react';

function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-container">
        <div className="topbar-brand">
          <div className="brand-icon">⚡</div>
          <div>
            <div className="brand-name">COQUI BOT</div>
            <div className="brand-tagline">Task Operations Dashboard</div>
          </div>
        </div>

        <div className="topbar-meta">
          <div className="meta-item">
            <span className="meta-label">Telegram-powered</span>
            <span className="meta-value">Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
