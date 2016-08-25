import { createSelector } from 'reselect';
import { List } from 'immutable';
import { getSubmissions } from './submissions';

export const getAssignments = state => state.assignments;
export const createAssignmentSelector = () =>
  createSelector(
    [ getAssignments, (state, id) => id ],
    (assignments, id) => assignments.getIn(['resources', id])
  );

export const getUsersSubmissionIds = (state, userId, assignmentId) => {
  const submissions = getAssignments(state).getIn(['submissions', assignmentId, userId]);
  if (!submissions) {
    return List();
  }

  return submissions;
};

export const createGetUsersSubmissionsForAssignment = () =>
  createSelector(
    [ getUsersSubmissionIds, getSubmissions ],
    (submissionIds, submissions) => submissionIds.map(id => submissions.get(id))
  );