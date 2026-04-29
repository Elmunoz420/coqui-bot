import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import useAuth from '../app/auth/useAuth';

function LoginPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [credentials, setCredentials] = useState({ name: '', username: '', password: '', role: 'developer' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  if (user) {
    return <Redirect to={user.role === 'admin' ? '/admin' : '/me'} />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await register(credentials);
      } else {
        await login(credentials);
      }
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
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
            <div className="landing-note">
              <ShieldRoundedIcon fontSize="small" />
              <div>
                <strong>Autenticación conectada a Oracle</strong>
              </div>
            </div>
          </div>

          <div className="landing-right-panel">
            <form className="login-form-card" onSubmit={handleSubmit}>
              <div className="role-option-icon admin"><LockRoundedIcon fontSize="medium" /></div>
              <div>
                <h2 className="landing-section-title">{mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
                <p className="landing-footer-copy">
                  {mode === 'register'
                    ? 'Crea tu acceso o activa contraseña para un usuario existente.'
                    : 'Usa tu username y contraseña registrados.'}
                </p>
              </div>

              {mode === 'register' && (
                <label className="login-field">
                  <span>Nombre</span>
                  <input
                    type="text"
                    name="name"
                    value={credentials.name}
                    onChange={handleChange}
                    placeholder="Fernanda Jiménez"
                    autoComplete="name"
                  />
                </label>
              )}

              <label className="login-field">
                <span>Usuario</span>
                <input
                  type="text"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  placeholder="usuario"
                  autoComplete="username"
                />
              </label>

              <label className="login-field">
                <span>Contraseña</span>
                <div className="password-input-row">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    placeholder="Tu contraseña"
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </label>

              {mode === 'register' && (
                <label className="login-field">
                  <span>Rol</span>
                  <select name="role" value={credentials.role} onChange={handleChange}>
                    <option value="developer">Developer</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              )}

              {error && <div className="login-error" role="alert">{error}</div>}

              <button type="submit" className="login-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Procesando...' : (mode === 'register' ? 'Crear cuenta' : 'Ingresar')}
                <ArrowForwardRoundedIcon fontSize="small" />
              </button>
            </form>
            <button
              type="button"
              className="landing-secondary-action"
              onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}
            >
              {mode === 'register' ? 'Ya tengo cuenta' : 'Crear cuenta'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
