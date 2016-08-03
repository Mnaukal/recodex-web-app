import { Map } from 'immutable';
import { createAction, handleActions } from 'redux-actions';
import { createApiAction } from '../middleware/apiMiddleware';

export const actionTypesFactory = resourceName => ({
  FETCH: `recodex/resource/${resourceName}/FETCH`,
  FETCH_PENDING: `recodex/resource/${resourceName}/FETCH_PENDING`,
  FETCH_FULFILLED: `recodex/resource/${resourceName}/FETCH_FULFILLED`,
  FETCH_FAILED: `recodex/resource/${resourceName}/FETCH_REJECTED`,
  INVALIDATE: `recodex/resource/${resourceName}/INVALIDATE`
});

export const isLoading = (item) =>
    !item || item.isFetching === true;

export const hasFailed = (item) =>
    !!item && item.error === true;

export const isReady = (item) =>
    !!item && !!item.data;

export const actionsFactory = (resourceName, selector, apiEndpointFactory) => {
  const actionTypes = actionTypesFactory(resourceName);

  /**
   * Makes use of cashing in the state
   */
  const needsRefetching = (id, getState) => {
    const state = selector(getState());
    if (!state) {
      return true;
    }

    const item = state.get(id);
    return !item || (
      item.isFetching === false && (
        item.error === true || item.didInvalidate === true
      )
    );
  };

  const fetchIfNeeded = (...ids) =>
    (dispatch, getState) =>
      ids.map(id => needsRefetching(id, getState) && dispatch(fetchResource(id)));

  const fetchOneIfNeeded = id =>
    (dispatch, getState) =>
      needsRefetching(id, getState)
        ? dispatch(fetchResource(id))
        : Promise.resolve();

  const fetchResource = id =>
    createApiAction({
      type: actionTypes.FETCH,
      method: 'GET',
      endpoint: apiEndpointFactory(id),
      meta: { id }
    });

  const pushResource = createAction(actionTypes.FETCH_FULFILLED, user => user, user => ({ id: user.id }));

  const invalidate = createAction(actionTypes.INVALIDATE);

  return { fetchIfNeeded, fetchOneIfNeeded, fetchResource, invalidate, pushResource };
};

export const initialState = Map({
  resources: Map()
});

export const createRecord = (isFetching, error, didInvalidate, data) =>
   ({ isFetching, error, didInvalidate, data });

export const reducerFactory = (resourceName) => {
  const actionTypes = actionTypesFactory(resourceName);
  return {
    [actionTypes.FETCH_PENDING]: (state, { meta }) =>
      state.setIn([ 'resources', meta.id ], createRecord(true, false, false, null)),

    [actionTypes.FETCH_FAILED]: (state, { meta }) =>
      state.setIn([ 'resources', meta.id ], createRecord(false, true, false, null)),

    [actionTypes.FETCH_FULFILLED]: (state, { meta, payload }) =>
      state.setIn([ 'resources', meta.id ], createRecord(false, false, false, payload)),

    [actionTypes.INVALIDATE]: (state, { payload }) =>
      state.updateIn([ 'resources', payload ], item => Object.assign({}, item, { didInvalidate: true }))

  };
};

export default (resourceName, slector, apiEndpointFactory) => ({
  actions: actionsFactory(resourceName, slector, apiEndpointFactory),
  reduceActions: reducerFactory(resourceName)
});