import 'isomorphic-fetch';

import React from 'react';
import { render } from 'react-dom';

import { IntlProvider, addLocaleData } from 'react-intl';
import cs from 'react-intl/locale-data/cs';

import { Provider } from 'react-redux';
import { Router, browserHistory, useRouterHistory } from 'react-router';
import { ReduxAsyncConnect } from 'redux-connect';
import { syncHistoryWithStore } from 'react-router-redux';
import useScroll from 'scroll-behavior/lib/useStandardScroll';
import createBrowserHistory from 'history/lib/createBrowserHistory';

import { configureStore } from './redux/store';
import createRoutes from './pages/routes';

import { getToken } from './redux/middleware/accessTokenMiddleware';

let state = window.__INITIAL_STATE__ || undefined;
const store = configureStore(browserHistory, state, getToken());
const createScrollHistory = useScroll(createBrowserHistory);
const appHistory = useRouterHistory(createScrollHistory)();
const history = syncHistoryWithStore(appHistory, store);

addLocaleData([ ...cs ]);

// @todo make locale changeable
render(
  <IntlProvider locale='cs'>
    <Provider store={store}>
      <Router
        render={(props) =>
          <ReduxAsyncConnect {...props} />}
        history={history}
        routes={createRoutes(store.getState)} />
    </Provider>
  </IntlProvider>,
  document.getElementById('root')
);