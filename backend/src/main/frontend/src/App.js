import React from 'react';
import { AuthProvider } from './app/auth/AuthContext';
import AppRouter from './app/router/AppRouter';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;