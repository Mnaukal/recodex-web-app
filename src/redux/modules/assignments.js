import { handleActions } from 'redux-actions';
import { fromJS } from 'immutable';

import { createApiAction } from '../middleware/apiMiddleware';
import { downloadHelper } from '../helpers/api/download';
import factory, { initialState } from '../helpers/resourceManager';

import { additionalActionTypes as submissionsActionTypes } from './submissions';

const resourceName = 'assignments';
const { actions, actionTypes, reduceActions } = factory({
  resourceName,
  apiEndpointFactory: (id = '') => `/exercise-assignments/${id}`
});

export { actionTypes };

export const additionalActionTypes = {
  VALIDATE_ASSIGNMENT: 'recodex/assignment/VALIDATE',
  SYNC_ASSIGNMENT: 'recodex/assignment/SYNC_ASSIGNMENT',
  SYNC_ASSIGNMENT_PENDING: 'recodex/assignment/SYNC_ASSIGNMENT_PENDING',
  SYNC_ASSIGNMENT_FULFILLED: 'recodex/assignment/SYNC_ASSIGNMENT_FULFILLED',
  DOWNLOAD_BEST_SOLUTIONS_ARCHIVE:
    'recodex/assignment/DOWNLOAD_BEST_SOLUTIONS_ARCHIVE'
};

/**
 * Actions
 */

export const loadAssignment = actions.pushResource;
export const fetchAssignmentsIfNeeded = actions.fetchIfNeeded;
export const fetchAssignment = actions.fetchResource;
export const fetchAssignmentIfNeeded = actions.fetchOneIfNeeded;

export const fetchAssignmentsForGroup = groupId =>
  actions.fetchMany({
    endpoint: `/groups/${groupId}/assignments`
  });

export const create = (groupId, exerciseId) =>
  actions.addResource({ groupId, exerciseId });
export const editAssignment = actions.updateResource;
export const deleteAssignment = actions.removeResource;

export const validateAssignment = (id, version) =>
  createApiAction({
    type: additionalActionTypes.VALIDATE_ASSIGNMENT,
    endpoint: `/exercise-assignments/${id}/validate`,
    method: 'POST',
    body: { version }
  });

export const syncWithExercise = assignmentId =>
  createApiAction({
    type: additionalActionTypes.SYNC_ASSIGNMENT,
    endpoint: `/exercise-assignments/${assignmentId}/sync-exercise`,
    method: 'POST',
    meta: { assignmentId }
  });

export const downloadBestSolutionsArchive = downloadHelper({
  actionType: additionalActionTypes.DOWNLOAD_BEST_SOLUTIONS_ARCHIVE,
  fetch: null,
  endpoint: id => `/exercise-assignments/${id}/download-best-solutions`,
  contentType: 'application/zip'
});

/**
 * Reducer
 */

const reducer = handleActions(
  Object.assign({}, reduceActions, {
    [submissionsActionTypes.LOAD_USERS_SUBMISSIONS_FULFILLED]: (
      state,
      { payload, meta: { userId, assignmentId } }
    ) =>
      state.setIn(
        ['submissions', assignmentId, userId],
        fromJS(payload.map(submission => submission.id))
      ),
    [additionalActionTypes.SYNC_ASSIGNMENT_FULFILLED]: (
      state,
      { payload, meta: { assignmentId } }
    ) => state.setIn(['resources', assignmentId, 'data'], fromJS(payload)),
    [submissionsActionTypes.RESUBMIT_ALL_PENDING]: (
      state,
      { meta: { assignmentId } }
    ) =>
      state.setIn(
        ['resources', assignmentId, 'data', 'resubmit-all-pending'],
        true
      ),
    [submissionsActionTypes.RESUBMIT_ALL_REJECTED]: (
      state,
      { meta: { assignmentId } }
    ) =>
      state.setIn(
        ['resources', assignmentId, 'data', 'resubmit-all-pending'],
        false
      ),
    [submissionsActionTypes.RESUBMIT_ALL_FULFILLED]: (
      state,
      { meta: { assignmentId } }
    ) =>
      state.setIn(
        ['resources', assignmentId, 'data', 'resubmit-all-pending'],
        false
      )
  }),
  initialState
);

export default reducer;
