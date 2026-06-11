import React from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import useAuth from '../auth/useAuth';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../../pages/LoginPage';
import AdminDashboard from '../../pages/AdminDashboard';
import DeveloperDashboard from '../../pages/DeveloperDashboard';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) {
    return <Redirect to="/login" />;
  }
  return <Redirect to={user.role === 'admin' ? '/admin' : '/me'} />;
}

function AppRouter() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={HomeRedirect} />
        <Route exact path="/login" component={LoginPage} />
        <ProtectedRoute exact path="/admin" allowedRoles={['admin']} component={AdminDashboard} />
        <ProtectedRoute exact path="/me" allowedRoles={['developer', 'admin']} component={DeveloperDashboard} />
        <Redirect to="/" />
      </Switch>
    </Router>
  );
}

export default AppRouter;
