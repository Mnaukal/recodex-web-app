import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Row, Col, Modal, DropdownButton, Dropdown } from 'react-bootstrap';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage, FormattedNumber } from 'react-intl';
import { Link } from 'react-router-dom';
import { defaultMemoize } from 'reselect';

import { ResubmitAllSolutionsContainer } from '../../containers/ResubmitSolutionContainer';
import DeleteSolutionButtonContainer from '../../containers/DeleteSolutionButtonContainer/DeleteSolutionButtonContainer';
import SolutionActionsContainer from '../../containers/SolutionActionsContainer';
import CommentThreadContainer from '../../containers/CommentThreadContainer';

import Page from '../../components/layout/Page';
import { AssignmentNavigation } from '../../components/layout/Navigation';
import Icon, {
  ChatIcon,
  DownloadIcon,
  DetailIcon,
  CodeFileIcon,
  LoadingIcon,
  PlagiarismIcon,
  ResultsIcon,
  UserIcon,
} from '../../components/icons';
import SolutionTableRowIcons from '../../components/Assignments/SolutionsTable/SolutionTableRowIcons';
import UsersName from '../../components/Users/UsersName';
import Points from '../../components/Assignments/SolutionsTable/Points';
import SolutionsTable from '../../components/Assignments/SolutionsTable';
import LoadingSolutionsTable from '../../components/Assignments/SolutionsTable/LoadingSolutionsTable';
import FailedLoadingSolutionsTable from '../../components/Assignments/SolutionsTable/FailedLoadingSolutionsTable';
import Box from '../../components/widgets/Box';
import Button, { TheButtonGroup } from '../../components/widgets/TheButton';
import DateTime from '../../components/widgets/DateTime';
import SortableTable, { SortableTableColumnDescriptor } from '../../components/widgets/SortableTable';
import ResourceRenderer from '../../components/helpers/ResourceRenderer';
import FetchManyResourceRenderer from '../../components/helpers/FetchManyResourceRenderer';
import { createUserNameComparator } from '../../components/helpers/users';
import { LocalizedExerciseName } from '../../components/helpers/LocalizedNames';
import EnvironmentsListItem from '../../components/helpers/EnvironmentsList/EnvironmentsListItem';
import Callout from '../../components/widgets/Callout';

import { fetchByIds } from '../../redux/modules/users';
import { fetchAssignmentIfNeeded, downloadBestSolutionsArchive } from '../../redux/modules/assignments';
import { fetchGroupIfNeeded } from '../../redux/modules/groups';
import { fetchRuntimeEnvironments } from '../../redux/modules/runtimeEnvironments';
import { fetchAssignmentSolutions, fetchAssignmentSolversIfNeeded } from '../../redux/modules/solutions';
import { setSolutionReviewState } from '../../redux/modules/solutionReviews';
import { usersSelector } from '../../redux/selectors/users';
import { groupSelector } from '../../redux/selectors/groups';
import { studentsIdsOfGroup } from '../../redux/selectors/usersGroups';
import {
  getAssignment,
  assignmentEnvironmentsSelector,
  getUserSolutionsSortedData,
  getAssignmentSolutions,
} from '../../redux/selectors/assignments';
import { loggedInUserIdSelector } from '../../redux/selectors/auth';
import {
  fetchManyAssignmentSolutionsStatus,
  isAssignmentSolversLoading,
  getAssignmentSolverSelector,
  getOneAssignmentSolvers,
} from '../../redux/selectors/solutions';
import { isReady, getJsData, getId } from '../../redux/helpers/resourceManager';

import { storageGetItem, storageSetItem } from '../../helpers/localStorage';
import withLinks from '../../helpers/withLinks';
import { safeGet, identity, arrayToObject, toPlainAscii, hasPermissions } from '../../helpers/common';

// View mode keys, labels, and filtering functions
const VIEW_MODE_DEFAULT = 'default';
const VIEW_MODE_GROUPED = 'grouped';
const VIEW_MODE_BEST = 'best';
const VIEW_MODE_LAST = 'last';
const VIEW_MODE_ACCEPTED = 'accepted';
const VIEW_MODE_REVIEWD = 'reviewed';

const viewModes = {
  [VIEW_MODE_DEFAULT]: (
    <FormattedMessage id="app.assignmentSolutions.viewModes.default" defaultMessage="All solutions (default)" />
  ),
  [VIEW_MODE_GROUPED]: (
    <FormattedMessage id="app.assignmentSolutions.viewModes.grouped" defaultMessage="Grouped by users" />
  ),
  [VIEW_MODE_BEST]: (
    <FormattedMessage id="app.assignmentSolutions.viewModes.best" defaultMessage="Best solutions only" />
  ),
  [VIEW_MODE_LAST]: (
    <FormattedMessage id="app.assignmentSolutions.viewModes.last" defaultMessage="Latest solutions only" />
  ),
  [VIEW_MODE_ACCEPTED]: (
    <FormattedMessage id="app.assignmentSolutions.viewModes.accepted" defaultMessage="Accepted solutions only" />
  ),
  [VIEW_MODE_REVIEWD]: (
    <FormattedMessage id="app.assignmentSolutions.viewModes.reviewed" defaultMessage="Reviewed solutions only" />
  ),
};

const _getLastAttemptIndices = defaultMemoize(solutions => {
  const lastAttemptIndices = {};
  solutions.filter(identity).forEach(s => {
    lastAttemptIndices[s.authorId] = Math.max(s.attemptIndex || 0, lastAttemptIndices[s.authorId] || 0);
  });
  return lastAttemptIndices;
});

const viewModeFilters = {
  [VIEW_MODE_DEFAULT]: null,
  [VIEW_MODE_GROUPED]: null,
  [VIEW_MODE_BEST]: solution => solution && solution.isBestSolution,
  [VIEW_MODE_LAST]: (solution, _, solutions) =>
    solution && solution.attemptIndex === _getLastAttemptIndices(solutions)[solution.authorId],
  [VIEW_MODE_ACCEPTED]: solution => solution && solution.accepted,
  [VIEW_MODE_REVIEWD]: solution => solution && solution.review,
};

const prepareTableColumnDescriptors = defaultMemoize((loggedUserId, assignmentId, groupId, viewMode, locale, links) => {
  const { SOLUTION_DETAIL_URI_FACTORY, SOLUTION_SOURCE_CODES_URI_FACTORY, GROUP_USER_SOLUTIONS_URI_FACTORY } = links;
  const nameComparator = createUserNameComparator(locale);

  const columns = [
    new SortableTableColumnDescriptor('icon', '', {
      className: 'text-nowrap',
      cellRenderer: solution => (
        <SolutionTableRowIcons
          id={solution.id}
          assignmentId={assignmentId}
          solution={solution}
          isReviewer={solution.permissionHints && solution.permissionHints.review}
        />
      ),
    }),

    new SortableTableColumnDescriptor(
      'date',
      <FormattedMessage id="app.solutionsTable.submissionDate" defaultMessage="Date of submission" />,
      {
        className: 'text-left',
        comparator: ({ date: d1 }, { date: d2 }) => d2 - d1, // dates are implicitly in reversed order
        cellRenderer: (createdAt, idx) =>
          createdAt && <DateTime unixts={createdAt} showOverlay overlayTooltipId={`datetime-${idx}`} />,
      }
    ),

    new SortableTableColumnDescriptor('attempt', '#', {
      className: 'text-center',
      cellRenderer: ({ attemptIndex, lastAttemptIndex }) => (
        <small
          className={
            'text-nowrap' +
            (viewMode === VIEW_MODE_BEST && lastAttemptIndex && lastAttemptIndex !== attemptIndex
              ? ' text-bold text-warning'
              : ' text-muted')
          }>
          {!lastAttemptIndex ? (
            <LoadingIcon />
          ) : viewMode === VIEW_MODE_BEST && lastAttemptIndex && lastAttemptIndex === attemptIndex ? (
            attemptIndex
          ) : (
            <FormattedMessage
              id="app.solution.solutionAttemptValue"
              defaultMessage="{index} of {count}"
              values={{
                index: attemptIndex,
                count: lastAttemptIndex,
              }}
            />
          )}
        </small>
      ),
    }),

    new SortableTableColumnDescriptor('user', <FormattedMessage id="generic.nameOfPerson" defaultMessage="Name" />, {
      className: 'text-left',
      comparator: ({ user: u1, date: d1 }, { user: u2, date: d2 }) => nameComparator(u1, u2) || d2 - d1, // dates are implicitly in reversed order
      cellRenderer: user =>
        user && (
          <UsersName
            {...user}
            currentUserId={loggedUserId}
            showEmail="icon"
            showExternalIdentifiers
            link={GROUP_USER_SOLUTIONS_URI_FACTORY(groupId, user.id)}
            listItem
          />
        ),
    }),

    new SortableTableColumnDescriptor(
      'validity',
      <FormattedMessage id="app.solutionsTable.solutionValidity" defaultMessage="Validity" />,
      {
        className: 'text-center',
        headerClassName: 'text-nowrap',
        comparator: ({ validity: v1, date: d1 }, { validity: v2, date: d2 }) =>
          (v2 === null ? -1 : v2) - (v1 === null ? -1 : v1) || d2 - d1, // values are implicitly form the best to the worst
        cellRenderer: validity =>
          validity !== null ? (
            <strong className="text-success">
              <FormattedNumber style="percent" value={validity} />
            </strong>
          ) : (
            <span className="text-danger">-</span>
          ),
      }
    ),

    new SortableTableColumnDescriptor(
      'points',
      <FormattedMessage id="app.solutionsTable.receivedPoints" defaultMessage="Points" />,
      {
        className: 'text-center',
        headerClassName: 'text-nowrap',
        comparator: ({ points: p1, date: d1 }, { points: p2, date: d2 }) => {
          const points1 = p1.actualPoints === null ? 0 : p1.bonusPoints + p1.actualPoints;
          const points2 = p2.actualPoints === null ? 0 : p2.bonusPoints + p2.actualPoints;
          return points2 - points1 || d2 - d1;
        },
        cellRenderer: points =>
          points.actualPoints !== null ? (
            <strong className="text-success">
              <Points points={points.actualPoints} bonusPoints={points.bonusPoints} maxPoints={points.maxPoints} />
            </strong>
          ) : (
            <span className="text-danger">-</span>
          ),
      }
    ),

    new SortableTableColumnDescriptor(
      'runtimeEnvironment',
      <FormattedMessage id="app.solutionsTable.environment" defaultMessage="Target language" />,
      {
        className: 'text-center',
        cellRenderer: runtimeEnvironment =>
          runtimeEnvironment ? <EnvironmentsListItem runtimeEnvironment={runtimeEnvironment} longNames /> : '-',
      }
    ),

    new SortableTableColumnDescriptor('note', <FormattedMessage id="app.solutionsTable.note" defaultMessage="Note" />, {
      className: 'small full-width',
      headerClassName: 'text-left',
    }),

    new SortableTableColumnDescriptor('actionButtons', '', {
      className: 'text-right valign-middle text-nowrap',
      cellRenderer: solution => (
        <TheButtonGroup>
          {solution.permissionHints && solution.permissionHints.viewDetail && (
            <>
              <Link to={SOLUTION_DETAIL_URI_FACTORY(assignmentId, solution.id)}>
                <Button size="xs" variant="secondary">
                  <DetailIcon gapRight />
                  <FormattedMessage id="generic.detail" defaultMessage="Detail" />
                </Button>
              </Link>
              <Link to={SOLUTION_SOURCE_CODES_URI_FACTORY(assignmentId, solution.id)}>
                <Button size="xs" variant="primary">
                  <CodeFileIcon fixedWidth gapRight />
                  <FormattedMessage id="generic.files" defaultMessage="Files" />
                </Button>
              </Link>
            </>
          )}

          {solution.permissionHints && (solution.permissionHints.setFlag || solution.permissionHints.review) && (
            <SolutionActionsContainer id={solution.id} showAllButtons dropdown />
          )}

          {solution.permissionHints && solution.permissionHints.delete && (
            <DeleteSolutionButtonContainer id={solution.id} groupId={groupId} size="xs" />
          )}
        </TheButtonGroup>
      ),
    }),
  ];

  return columns.filter(c => c);
});

const prepareTableData = defaultMemoize(
  (assignmentSolutions, users, assignmentSolvers, runtimeEnvironments, viewMode) => {
    const solvers = (assignmentSolvers && assignmentSolvers.toJS()) || {};
    const usersIndex = arrayToObject(users);
    return assignmentSolutions
      .toArray()
      .map(getJsData)
      .filter(solution => solution && usersIndex[solution.authorId])
      .filter(viewModeFilters[viewMode] || identity)
      .map(s => {
        const statusEvaluated = s.lastSubmission && (s.lastSubmission.evaluation || s.lastSubmission.failure);
        return {
          icon: s,
          user: usersIndex[s.authorId],
          date: s.createdAt,
          attempt: {
            attemptIndex: s.attemptIndex,
            lastAttemptIndex: solvers[s.authorId] && solvers[s.authorId].lastAttemptIndex,
          },
          validity: statusEvaluated ? safeGet(s.lastSubmission, ['evaluation', 'score']) : null,
          points: statusEvaluated ? s : { actualPoints: null },
          runtimeEnvironment: runtimeEnvironments.find(({ id }) => id === s.runtimeEnvironmentId),
          note: s.note,
          actionButtons: s,
        };
      });
  }
);

const getPendingReviewSolutions = defaultMemoize(assignmentSolutions =>
  assignmentSolutions
    .toArray()
    .map(getJsData)
    .filter(solution => solution && solution.review && solution.review.startedAt && !solution.review.closedAt)
);

const getPlagiarisms = defaultMemoize(assignmentSolutions =>
  assignmentSolutions
    .toArray()
    .map(getJsData)
    .filter(solution => solution && solution.plagiarism)
);

const localStorageStateKey = 'AssignmentSolutions.state';

class AssignmentSolutions extends Component {
  static loadAsync = ({ assignmentId }, dispatch) =>
    Promise.all([
      dispatch(fetchAssignmentIfNeeded(assignmentId))
        .then(res => res.value)
        .then(assignment =>
          dispatch(fetchGroupIfNeeded(assignment.groupId)).then(({ value: group }) =>
            dispatch(fetchByIds(safeGet(group, ['privateData', 'students']) || []))
          )
        ),
      dispatch(fetchRuntimeEnvironments()),
      dispatch(fetchAssignmentSolversIfNeeded({ assignmentId })),
      dispatch(fetchAssignmentSolutions(assignmentId)),
    ]);

  state = {
    viewMode: VIEW_MODE_DEFAULT,
    assignmentDialogOpen: false,
    closingReviews: false,
    closingReviewsFailed: false,
  };

  viewModeSelectHandler = viewMode => {
    this.setState({ viewMode });
    storageSetItem(localStorageStateKey, { viewMode });
  };

  openDialog = () => this.setState({ assignmentDialogOpen: true });
  closeDialog = () => this.setState({ assignmentDialogOpen: false });

  componentDidMount() {
    this.props.loadAsync();
    this.setState(storageGetItem(localStorageStateKey, null));
  }

  componentDidUpdate(prevProps) {
    if (this.props.assignmentId !== prevProps.assignmentId) {
      this.props.loadAsync();
    }
  }

  getArchiveFileName = assignment => {
    const {
      assignmentId,
      intl: { locale: pageLocale },
    } = this.props;
    const name =
      assignment &&
      safeGet(assignment, ['localizedTexts', ({ locale }) => locale === pageLocale, 'name'], assignment.name);
    const safeName = toPlainAscii(name);
    return `${safeName || assignmentId}.zip`;
  };

  closeReviews = solutions => {
    this.setState({ closingReviews: true, closingReviewsFailed: false });
    return Promise.all(solutions.map(({ id }) => this.props.closeReview(id))).then(
      () => this.setState({ closingReviews: false }),
      () => this.setState({ closingReviews: false, closingReviewsFailed: true })
    );
  };

  openLinkGenerator = ({ actionButtons: { id, permissionHints } }) => {
    const {
      assignmentId,
      links: { SOLUTION_DETAIL_URI_FACTORY },
    } = this.props;
    return permissionHints && permissionHints.viewDetail ? SOLUTION_DETAIL_URI_FACTORY(assignmentId, id) : null;
  };

  // Re-format the data, so they can be rendered by the SortableTable ...
  render() {
    const {
      loggedUserId,
      assignmentId,
      assignment,
      getStudents,
      getGroup,
      getUserSolutions,
      runtimeEnvironments,
      assignmentSolutions,
      downloadBestSolutionsArchive,
      fetchManyStatus,
      assignmentSolversLoading,
      assignmentSolverSelector,
      assignmentSolvers,
      intl: { locale },
      links,
    } = this.props;

    const pendingReviews = getPendingReviewSolutions(assignmentSolutions);
    const plagiarisms = getPlagiarisms(assignmentSolutions);

    return (
      <Page
        resource={assignment}
        icon={<ResultsIcon />}
        title={
          <FormattedMessage id="app.assignmentSolutions.title" defaultMessage="All Submissions of The Assignment" />
        }>
        {assignment => (
          <div>
            <AssignmentNavigation
              assignmentId={assignment.id}
              groupId={assignment.groupId}
              exerciseId={assignment.exerciseId}
              canEdit={hasPermissions(assignment, 'update')}
              canViewSolutions={hasPermissions(assignment, 'viewAssignmentSolutions')}
              canViewExercise={true}
            />

            {plagiarisms && plagiarisms.length > 0 && (
              <Callout variant="danger" icon={<PlagiarismIcon />}>
                <FormattedMessage
                  id="app.assignmentSolutions.plagiarismsDetected"
                  defaultMessage="There {count, plural, one {is} other {are}} {count} {count, plural, one {solution} other {solutions}} with detected similarities. Such solutions may be plagiarisms."
                  values={{ count: plagiarisms.length }}
                />
              </Callout>
            )}

            {pendingReviews && pendingReviews.length > 0 && (
              <Callout variant="warning">
                <Row className="align-items-center">
                  <Col className="pr-3 py-2">
                    <FormattedMessage
                      id="app.assignmentSolutions.pendingReviews"
                      defaultMessage="There {count, plural, one {is} other {are}} {count} pending {count, plural, one {review} other {reviews}} among the solutions of the selected assignment. Remember that the review comments are visible to the author after a review is closed."
                      values={{ count: pendingReviews.length }}
                    />
                  </Col>
                  <Col xl="auto">
                    <Button
                      variant={this.state.closingReviewsFailed ? 'danger' : 'success'}
                      onClick={() => this.closeReviews(pendingReviews)}
                      disabled={this.state.closingReviews}>
                      {this.state.closingReviews ? <LoadingIcon gapRight /> : <Icon icon="boxes-packing" gapRight />}
                      <FormattedMessage
                        id="app.reviewSolutionButtons.closePendingReviews"
                        defaultMessage="Close pending reviews"
                      />
                    </Button>
                  </Col>
                </Row>
              </Callout>
            )}

            <Row>
              <Col sm={12} md>
                <TheButtonGroup className="mb-3 text-nowrap">
                  {hasPermissions(assignment, 'viewAssignmentSolutions') && (
                    <a href="#" onClick={downloadBestSolutionsArchive(this.getArchiveFileName(assignment))}>
                      <Button variant="primary">
                        <DownloadIcon gapRight />
                        <FormattedMessage
                          id="app.assignment.downloadBestSolutionsArchive"
                          defaultMessage="Download Bests"
                        />
                      </Button>
                    </a>
                  )}

                  {hasPermissions(assignment, 'resubmitSubmissions') && (
                    <ResubmitAllSolutionsContainer assignmentId={assignment.id} />
                  )}

                  <Button variant="info" onClick={this.openDialog}>
                    <ChatIcon gapRight />
                    <FormattedMessage id="generic.discussion" defaultMessage="Discussion" />
                  </Button>
                </TheButtonGroup>

                <Modal show={this.state.assignmentDialogOpen} backdrop="static" onHide={this.closeDialog} size="xl">
                  <CommentThreadContainer
                    threadId={assignment.id}
                    title={
                      <>
                        <FormattedMessage
                          id="app.assignments.discussionModalTitle"
                          defaultMessage="Public Discussion"
                        />
                        : <LocalizedExerciseName entity={{ name: '??', localizedTexts: assignment.localizedTexts }} />
                      </>
                    }
                    additionalPublicSwitchNote={
                      <FormattedMessage
                        id="app.assignments.discussionModal.additionalSwitchNote"
                        defaultMessage="(supervisors and students of this group)"
                      />
                    }
                    displayAs="modal"
                  />
                </Modal>
              </Col>

              <Col sm={false} md="auto" className="text-nowrap pt-2 mb-3">
                <DropdownButton
                  menuAlign="right"
                  title={
                    <>
                      <Icon icon="binoculars" gapRight />
                      {viewModes[this.state.viewMode] || ''}
                    </>
                  }
                  className="elevation-2"
                  id="viewModeDropdown">
                  <Dropdown.Header>
                    <FormattedMessage
                      id="app.assignmentSolutions.viewModesTitle"
                      defaultMessage="Select solutions view filter"
                    />
                  </Dropdown.Header>
                  <Dropdown.Divider />
                  {Object.keys(viewModes).map(viewMode => (
                    <Dropdown.Item
                      key={viewMode}
                      eventKey={viewMode}
                      active={viewMode === this.state.viewMode}
                      onSelect={this.viewModeSelectHandler}>
                      {viewModes[viewMode]}
                    </Dropdown.Item>
                  ))}
                </DropdownButton>
              </Col>
            </Row>

            <ResourceRenderer resource={[getGroup(assignment.groupId), ...runtimeEnvironments]}>
              {(group, ...runtimes) => (
                <FetchManyResourceRenderer
                  fetchManyStatus={fetchManyStatus}
                  loading={<LoadingSolutionsTable />}
                  failed={<FailedLoadingSolutionsTable />}>
                  {() =>
                    this.state.viewMode === VIEW_MODE_GROUPED ? (
                      <div>
                        {getStudents(group.id)
                          .sort(
                            (a, b) =>
                              a.name.lastName.localeCompare(b.name.lastName, locale) ||
                              a.name.firstName.localeCompare(b.name.firstName, locale)
                          )
                          .map(user => (
                            <Row key={user.id}>
                              <Col sm={12}>
                                <Box
                                  title={
                                    <>
                                      <UserIcon gapRight className="text-muted" />
                                      {user.fullName}
                                      <small className="ml-3 text-nowrap">
                                        (
                                        <Link to={links.GROUP_USER_SOLUTIONS_URI_FACTORY(group.id, user.id)}>
                                          <FormattedMessage
                                            id="app.assignmentSolutions.allUserSolutions"
                                            defaultMessage="all user solutions"
                                          />
                                        </Link>
                                        )
                                      </small>
                                    </>
                                  }
                                  collapsable
                                  isOpen
                                  noPadding
                                  unlimitedHeight>
                                  <SolutionsTable
                                    solutions={getUserSolutions(user.id)}
                                    assignmentId={assignmentId}
                                    groupId={assignment.groupId}
                                    runtimeEnvironments={runtimes}
                                    noteMaxlen={160}
                                    assignmentSolversLoading={assignmentSolversLoading}
                                    assignmentSolver={assignmentSolverSelector(assignmentId, user.id)}
                                  />
                                </Box>
                              </Col>
                            </Row>
                          ))}
                      </div>
                    ) : (
                      <Box
                        title={
                          <FormattedMessage
                            id="app.assignmentSolutions.assignmentSolutions"
                            defaultMessage="Assignment Solutions"
                          />
                        }
                        unlimitedHeight
                        noPadding>
                        <SortableTable
                          hover
                          columns={prepareTableColumnDescriptors(
                            loggedUserId,
                            assignmentId,
                            group.id,
                            this.state.viewMode,
                            locale,
                            links
                          )}
                          defaultOrder="date"
                          data={prepareTableData(
                            assignmentSolutions,
                            getStudents(group.id),
                            assignmentSolversLoading ? null : assignmentSolvers,
                            runtimes,
                            this.state.viewMode
                          )}
                          openLinkGenerator={this.openLinkGenerator}
                          empty={
                            <div className="text-center text-muted">
                              <FormattedMessage
                                id="app.assignmentSolutions.noSolutions"
                                defaultMessage="There are currently no submitted solutions."
                              />
                            </div>
                          }
                          className="mb-0"
                        />
                      </Box>
                    )
                  }
                </FetchManyResourceRenderer>
              )}
            </ResourceRenderer>
          </div>
        )}
      </Page>
    );
  }
}

AssignmentSolutions.propTypes = {
  loggedUserId: PropTypes.string.isRequired,
  assignmentId: PropTypes.string.isRequired,
  assignment: PropTypes.object,
  getStudents: PropTypes.func.isRequired,
  getGroup: PropTypes.func.isRequired,
  getUserSolutions: PropTypes.func.isRequired,
  runtimeEnvironments: PropTypes.array,
  assignmentSolutions: ImmutablePropTypes.list,
  loadAsync: PropTypes.func.isRequired,
  downloadBestSolutionsArchive: PropTypes.func.isRequired,
  fetchManyStatus: PropTypes.string,
  assignmentSolversLoading: PropTypes.bool,
  assignmentSolverSelector: PropTypes.func.isRequired,
  assignmentSolvers: ImmutablePropTypes.map,
  closeReview: PropTypes.func.isRequired,
  intl: PropTypes.object,
  links: PropTypes.object.isRequired,
};

export default withLinks(
  connect(
    (state, { params: { assignmentId } }) => {
      const assignment = getAssignment(state, assignmentId);
      const getStudentsIds = groupId => studentsIdsOfGroup(groupId)(state);
      const readyUsers = usersSelector(state).toArray().filter(isReady);

      return {
        loggedUserId: loggedInUserIdSelector(state),
        assignmentId,
        assignment,
        getStudentsIds,
        getStudents: groupId => readyUsers.filter(user => getStudentsIds(groupId).includes(getId(user))).map(getJsData),
        getUserSolutions: userId => getUserSolutionsSortedData(state)(userId, assignmentId),
        assignmentSolutions: getAssignmentSolutions(state, assignmentId),
        getGroup: id => groupSelector(state, id),
        runtimeEnvironments: assignmentEnvironmentsSelector(state)(assignmentId),
        fetchManyStatus: fetchManyAssignmentSolutionsStatus(assignmentId)(state),
        assignmentSolversLoading: isAssignmentSolversLoading(state),
        assignmentSolverSelector: getAssignmentSolverSelector(state),
        assignmentSolvers: getOneAssignmentSolvers(state, assignmentId),
      };
    },
    (dispatch, { params: { assignmentId } }) => ({
      loadAsync: () => AssignmentSolutions.loadAsync({ assignmentId }, dispatch),
      downloadBestSolutionsArchive: name => ev => {
        ev.preventDefault();
        dispatch(downloadBestSolutionsArchive(assignmentId, name));
      },
      closeReview: id => dispatch(setSolutionReviewState(id, true)),
    })
  )(injectIntl(AssignmentSolutions))
);
