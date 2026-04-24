import React from 'react';
import { render } from '@testing-library/react';
import LoginPage from './LoginPage';
import useAuth from '../app/auth/useAuth';

jest.mock('../app/auth/useAuth');
jest.mock('react-router-dom', () => ({
  Redirect: ({ to }) => <div>{to}</div>,
}));

describe('LoginPage.snapshot', () => {
  test('matches the landing page snapshot for the current mock-login UI', () => {
    // El snapshot se toma sin sesión para congelar la landing pública actual.
    useAuth.mockReturnValue({
      user: null,
      loginAs: jest.fn(),
    });

    const { asFragment } = render(<LoginPage />);

    // Sirve para detectar cambios visuales grandes en la pantalla de entrada.
    expect(asFragment()).toMatchSnapshot();
  });
});
