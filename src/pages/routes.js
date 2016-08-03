import React from 'react';
import { Route, IndexRoute, Link } from 'react-router';
import { DASHBOARD_URI, LOGIN_URI } from '../links';

/* container components */
import LayoutContainer from '../containers/LayoutContainer';
import App from '../containers/App';
import Dashboard from './Dashboard';
import Home from './Home';
import Group from './Group';
import Login from './Login';
import Assignment from './Assignment';
import NotFound from './NotFound';
import Submission from './Submission';
import SubmissionsTableContainer from '../containers/SubmissionsTableContainer';

const createRoutes = (getState) => {
  const requireAuth = (nextState, replace) => {
    const auth = getState().auth;
    if (!auth.accessToken) {
      replace(LOGIN_URI);
    }
  };

  const onlyUnauth = (nextState, replace) => {
    const auth = getState().auth;
    if (auth.accessToken) {
      replace(DASHBOARD_URI);
    }
  };

  return (
    <Route path='/' component={LayoutContainer}>
      <IndexRoute component={Home} />
      <Route path='login' component={Login} onEnter={onlyUnauth} />
      <Route path='app' onEnter={requireAuth} component={App}>
        <IndexRoute component={Dashboard} />
        <Route path='assignment/:assignmentId' component={Assignment} >
          <IndexRoute component={SubmissionsTableContainer} />
          <Route path='submission/:submissionId' component={Submission} />
        </Route>
        <Route path='group/:groupId' component={Group} />
      </Route>
      <Route path='*' component={NotFound} />
    </Route>
  );
};

export default createRoutes;