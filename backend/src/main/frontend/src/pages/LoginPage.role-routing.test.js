import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import useAuth from '../app/auth/useAuth';

jest.mock('../app/auth/useAuth');
jest.mock('react-router-dom', () => ({
  Redirect: ({ to }) => <div data-testid="redirect-target">{to}</div>,
}));

const adminUser = {
  id: 'admin-1',
  username: 'fernanda.admin',
  name: 'Fernanda Jimenez',
  role: 'admin',
};

const developerUser = {
  id: 'dev-1',
  username: 'fernanda',
  name: 'Fernanda Jimenez',
  role: 'developer',
};

describe('LoginPage.role-routing', () => {
  let setUserRef;
  let loginAsMock;

  // Este harness nos deja simular el login mock y observar la redirección
  // sin depender del router real del navegador.
  function Harness() {
    const [user, setUser] = React.useState(null);
    setUserRef = setUser;
    useAuth.mockReturnValue({
      user,
      loginAs: loginAsMock,
    });
    return <LoginPage />;
  }

  beforeEach(() => {
    setUserRef = null;
    // Si el usuario elige un rol, actualizamos la sesión mock para disparar el Redirect.
    loginAsMock = jest.fn((role) => {
      if (role === 'admin') {
        setUserRef(adminUser);
      } else {
        setUserRef(developerUser);
      }
    });
  });

  test('routes admin users to the admin dashboard after clicking the admin CTA', async () => {
    render(<Harness />);

    // Se valida el happy path: click del usuario y navegación al panel correcto.
    await userEvent.click(screen.getByRole('button', { name: /ingresar como admin/i }));

    expect(loginAsMock).toHaveBeenCalledWith('admin');
    expect(screen.getByTestId('redirect-target').textContent).toBe('/admin');
  });

  test('routes developer users to the personal dashboard after clicking the dev CTA', async () => {
    render(<Harness />);

    // Mismo flujo, pero para la vista personalizada del developer.
    await userEvent.click(screen.getByRole('button', { name: /ingresar como dev/i }));

    expect(loginAsMock).toHaveBeenCalledWith('developer');
    expect(screen.getByTestId('redirect-target').textContent).toBe('/me');
  });
});
