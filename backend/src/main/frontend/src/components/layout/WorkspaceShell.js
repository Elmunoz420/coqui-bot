import React from 'react';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';

function WorkspaceShell({
  title,
  roleLabel,
  user,
  onLogout,
  navItems,
  activeNav,
  accent = 'emerald',
  children,
}) {
  return (
    <div className={`workspace-shell accent-${accent}`}>
      <aside className="workspace-sidebar">
        <div>
          <div className="workspace-brand">
            <div className="brand-icon">🐸</div>
            <div>
              <div className="brand-name">COQUI BOT</div>
              <div className="brand-tagline">{title}</div>
            </div>
          </div>

          <div className="workspace-role-chip">{roleLabel}</div>

          <nav className="workspace-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`workspace-nav-item ${activeNav === item.id ? 'active' : ''}`}
                  onClick={item.onClick}
                >
                  <Icon fontSize="small" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="workspace-profile-card">
          <div className="workspace-avatar">
            {user?.name?.split(' ').map((chunk) => chunk[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="workspace-profile-copy">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
          {onLogout && (
            <button type="button" className="workspace-logout-link" onClick={onLogout}>
              Salir
            </button>
          )}
        </div>
      </aside>

      <section className="workspace-stage">
        <header className="workspace-stage-header">
          <div className="workspace-status-pill">● Conectado</div>
          <button type="button" className="workspace-icon-button" aria-label="Notificaciones">
            <NotificationsNoneRoundedIcon fontSize="small" />
          </button>
        </header>

        <main className="workspace-stage-content">{children}</main>
      </section>
    </div>
  );
}

export default WorkspaceShell;
