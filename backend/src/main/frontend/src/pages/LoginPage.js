import React from 'react';
import { Redirect } from 'react-router-dom';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import useAuth from '../app/auth/useAuth';

function LoginPage() {
  const { user, loginAs } = useAuth();

  if (user) {
    return <Redirect to={user.role === 'admin' ? '/admin' : '/me'} />;
  }

  return (
    <main className="landing-shell">
      <section className="landing-card">
        <div className="landing-brand-row">
          <div className="workspace-brand">
            <div className="brand-icon">🐸</div>
            <div>
              <div className="brand-name">COQUI BOT</div>
              <div className="brand-tagline">Plataforma de gestión de tareas</div>
            </div>
          </div>
          <div className="workspace-status-pill">● Conectado</div>
        </div>

        <div className="landing-grid">
          <div className="landing-left-panel">
            <span className="landing-kicker">Bienvenido a COQUI BOT</span>
            <h1 className="landing-title">Plataforma de gestion de tareas</h1>
            <p className="landing-copy">
              Ingresa según tu rol y usa la vista adecuada para tu trabajo.
            </p>
            <div className="landing-note">
              <ShieldRoundedIcon fontSize="small" />
              <div>
                <strong>Sesión mock activa para desarrollo</strong>
                <span>Los datos mostrados son simulados.</span>
              </div>
            </div>
          </div>

          <div className="landing-right-panel">
            <div className="role-selector-grid">
              <button type="button" className="role-option-card admin" onClick={() => loginAs('admin')}>
                <div className="role-option-icon admin"><AdminPanelSettingsRoundedIcon fontSize="medium" /></div>
                <strong>Admin</strong>
                <span>Panel global del proyecto.</span>
                <span className="role-option-cta">Ingresar como admin <ArrowForwardRoundedIcon fontSize="small" /></span>
              </button>

              <button type="button" className="role-option-card developer" onClick={() => loginAs('developer')}>
                <div className="role-option-icon developer"><CodeRoundedIcon fontSize="medium" /></div>
                <strong>Dev</strong>
                <span>Workspace personal de tareas.</span>
                <span className="role-option-cta">Ingresar como dev <ArrowForwardRoundedIcon fontSize="small" /></span>
              </button>
            </div>
            <button type="button" className="landing-secondary-action">
              Crear cuenta
            </button>
            <p className="landing-footer-copy">El login real se conectará después con backend y roles persistidos.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
