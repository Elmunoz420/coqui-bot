import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuth from '../auth/useAuth';

function ProtectedRoute({ component: Component, allowedRoles, ...rest }) {
  const { user, isAuthenticated } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!isAuthenticated) {
          return <Redirect to="/login" />;
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
          return <Redirect to={user.role === 'admin' ? '/admin' : '/me'} />;
        }

        return <Component {...props} />;
      }}
    />
  );
}

export default ProtectedRoute;
