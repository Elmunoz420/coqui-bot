import React from 'react';
import CoquiIcon from './CoquiIcon';

function Topbar({ tagline = 'Panel de Operaciones de Tareas', user, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-container">
        <div className="topbar-brand">
          <div className="brand-icon"><CoquiIcon /></div>
          <div>
            <div className="brand-name">COQUI BOT</div>
            <div className="brand-tagline">{tagline}</div>
          </div>
        </div>
        <div className="topbar-meta">
          <div className="meta-item">
            <span className="meta-label">Telegram</span>
            <span className="meta-value meta-connected">● Conectado</span>
          </div>
          {user && (
            <div className="meta-item">
              <span className="meta-label">Sesión</span>
              <span className="meta-value">{user.name} · {user.role}</span>
            </div>
          )}
          {user && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                border: '1px solid var(--border-default)',
                background: 'transparent',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '8px 12px',
              }}
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
