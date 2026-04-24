import React from 'react';
import { MemoryRouter, Route, Switch } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import useAuth from '../auth/useAuth';

jest.mock('../auth/useAuth');

function SecretPage() {
  return <div>Secret dashboard</div>;
}

describe('ProtectedRoute', () => {
  test('redirects unauthenticated users to login', () => {
    // Aquí simulamos que no existe sesión activa.
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Switch>
          <ProtectedRoute exact path="/admin" allowedRoles={['admin']} component={SecretPage} />
          <Route path="/login">
            <div>Login required</div>
          </Route>
        </Switch>
      </MemoryRouter>
    );

    // Lo importante es lo que ve el usuario: no entra al dashboard y cae al login.
    expect(screen.getByText('Login required')).toBeTruthy();
    expect(screen.queryByText('Secret dashboard')).toBeNull();
  });

  test('redirects authenticated users away from routes that do not match their role', () => {
    // En este caso sí hay sesión, pero con un rol que no tiene permiso para /admin.
    useAuth.mockReturnValue({
      user: {
        id: 'dev-1',
        username: 'fernanda',
        name: 'Fernanda Jimenez',
        role: 'developer',
      },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Switch>
          <ProtectedRoute exact path="/admin" allowedRoles={['admin']} component={SecretPage} />
          <Route path="/me">
            <div>Developer home</div>
          </Route>
        </Switch>
      </MemoryRouter>
    );

    // Debe terminar en su home válida y no ver contenido restringido.
    expect(screen.getByText('Developer home')).toBeTruthy();
    expect(screen.queryByText('Secret dashboard')).toBeNull();
  });
});
