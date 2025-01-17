import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Row, Col } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

import SolutionFiles from '../../Solutions/SolutionFiles';
import EvaluationDetail from '../../Solutions/EvaluationDetail';
import TestResults from '../../Solutions/TestResults';
import DownloadResultArchiveContainer from '../../../containers/DownloadResultArchiveContainer';
import CommentThreadContainer from '../../../containers/CommentThreadContainer';
import SourceCodeViewerContainer from '../../../containers/SourceCodeViewerContainer';
import SubmissionEvaluations from '../../Solutions/SubmissionEvaluations';
import { ScoreConfigInfoDialog } from '../../scoreConfig/ScoreConfigInfo';
import CompilationLogs from '../../Solutions/CompilationLogs';
import ReferenceSolutionStatus from '../ReferenceSolutionStatus/ReferenceSolutionStatus';

import Button from '../../widgets/TheButton';
import Callout from '../../widgets/Callout';
import DateTime from '../../widgets/DateTime';
import ResourceRenderer from '../../helpers/ResourceRenderer';
import { RefreshIcon, WarningIcon, EvaluationFailedIcon } from '../../icons';

import { EMPTY_OBJ, getFirstItemInOrder } from '../../../helpers/common';

const getLastSubmissionId = evaluations => {
  const evalArray = Object.values(evaluations)
    .map(x => x.data)
    .filter(a => a.submittedAt);
  const first = getFirstItemInOrder(evalArray, (a, b) => b.submittedAt - a.submittedAt);
  return first && first.id;
};

class ReferenceSolutionDetail extends Component {
  state = {
    openFileId: null,
    openFileName: '',
    openZipEntry: null,
    activeSubmissionId: null,
    scoreDialogOpened: false,
  };

  setActiveSubmission = id => {
    this.props.fetchScoreConfigIfNeeded && this.props.fetchScoreConfigIfNeeded(id);
    this.setState({ activeSubmissionId: id });
  };

  openFile = (openFileId, openFileName, openZipEntry = null) =>
    this.setState({ openFileId, openFileName, openZipEntry });

  hideFile = () => this.setState({ openFileId: null, openFileName: '', openZipEntry: null });

  openScoreDialog = () => {
    const evaluationsJS = this.props.evaluations && this.props.evaluations.toJS();
    const activeSubmissionId = evaluationsJS && (this.state.activeSubmissionId || getLastSubmissionId(evaluationsJS));
    if (activeSubmissionId) {
      this.props.fetchScoreConfigIfNeeded && this.props.fetchScoreConfigIfNeeded(activeSubmissionId);
      this.setState({ scoreDialogOpened: true });
    }
  };

  closeScoreDialog = () => this.setState({ scoreDialogOpened: false });

  render() {
    const {
      solution: { id, description, runtimeEnvironmentId, createdAt, authorId, visibility, permissionHints = EMPTY_OBJ },
      files,
      download,
      exercise,
      evaluations,
      deleteEvaluation = null,
      refreshSolutionEvaluations = null,
      runtimeEnvironments,
      scoreConfigSelector = null,
      canResubmit = false,
    } = this.props;
    const { openFileId, openFileName, openZipEntry, scoreDialogOpened } = this.state;
    const evaluationsJS = evaluations && evaluations.toJS();
    const activeSubmissionId = evaluationsJS && (this.state.activeSubmissionId || getLastSubmissionId(evaluationsJS));

    if (activeSubmissionId && evaluationsJS[activeSubmissionId] && evaluationsJS[activeSubmissionId].data) {
      /* eslint-disable no-var */
      var { submittedBy, evaluation, failure, isDebug, ...restSub } = evaluationsJS[activeSubmissionId].data;
    }

    return (
      <div>
        <Row>
          <Col md={6} sm={12}>
            <ReferenceSolutionStatus
              description={description}
              submittedAt={createdAt}
              authorId={authorId}
              submittedBy={submittedBy}
              exerciseId={exercise.id}
              environment={
                runtimeEnvironments &&
                runtimeEnvironmentId &&
                runtimeEnvironments.find(({ id }) => id === runtimeEnvironmentId)
              }
              visibility={visibility}
            />

            <SolutionFiles
              solutionId={id}
              files={files}
              authorId={authorId}
              isReference={true}
              openFile={this.openFile}
              download={download}
            />

            <CommentThreadContainer
              threadId={id}
              additionalPublicSwitchNote={
                <FormattedMessage
                  id="app.referenceSolutionDetail.comments.additionalSwitchNote"
                  defaultMessage="(teachers who can see this reference solution)"
                />
              }
            />
          </Col>

          {evaluations && (
            <Col md={6} sm={12}>
              {!evaluation && (!evaluations || evaluations.size === 0) && (
                <Callout variant="danger" icon={<WarningIcon />}>
                  <FormattedMessage
                    id="app.submissionEvaluation.noEvaluationsWhatSoEver"
                    defaultMessage="There are no submission evaluations. This is higly unusual, since the solution is submitted for evaluation as soon as it is created. Check the configuration of the exercise and try to resubmit this solution again."
                  />
                </Callout>
              )}

              {!evaluation && !failure && evaluations && evaluations.size > 0 && refreshSolutionEvaluations && (
                <Callout variant="warning">
                  <table>
                    <tbody>
                      <tr>
                        <td width="100%" className="em-padding-right">
                          <FormattedMessage
                            id="app.submissionEvaluation.noEvaluationYet"
                            defaultMessage="The evaluation is not available yet. Click the refresh button for an update."
                          />
                        </td>
                        <td>
                          <Button onClick={refreshSolutionEvaluations} variant="primary">
                            <RefreshIcon gapRight />
                            <FormattedMessage id="generic.refresh" defaultMessage="Refresh" />
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Callout>
              )}

              {failure && (
                <>
                  <Callout variant="danger" icon={<EvaluationFailedIcon />}>
                    <h4>
                      <FormattedMessage
                        id="app.submissionEvaluation.evaluationFailedHeading"
                        defaultMessage="The evaluation has failed!"
                      />
                    </h4>

                    {typeof failure === 'object' ? (
                      <p>
                        <FormattedMessage
                          id="app.submissionEvaluation.evaluationFailedMessage"
                          defaultMessage="Backend message"
                        />
                        : <em>{failure.description}</em>
                      </p>
                    ) : (
                      <p>
                        <FormattedMessage
                          id="app.submissionEvaluation.evaluationFailedInternalError"
                          defaultMessage="Internal backend error."
                        />
                      </p>
                    )}
                  </Callout>

                  {Boolean(typeof failure === 'object' && failure.resolvedAt && failure.resolutionNote) && (
                    <Callout variant="success" icon="fire-extinguisher">
                      <span className="small float-right">
                        (<DateTime unixts={failure.resolvedAt} />)
                      </span>
                      <h4>
                        <FormattedMessage
                          id="app.submissionEvaluation.evaluationFailureResolved"
                          defaultMessage="The failure has been resolved by admin!"
                        />
                      </h4>
                      <p>
                        <FormattedMessage
                          id="app.submissionEvaluation.evaluationFailureResolvedNote"
                          defaultMessage="Resolution note"
                        />
                        : <em>{failure.resolutionNote}</em>
                      </p>
                    </Callout>
                  )}
                </>
              )}

              {evaluation && (
                <EvaluationDetail
                  evaluation={evaluation}
                  isDebug={isDebug}
                  viewResumbissions
                  showScoreDetail={this.openScoreDialog}
                  referenceSolution
                />
              )}

              {evaluation && <CompilationLogs initiationOutputs={evaluation.initiationOutputs} />}

              {evaluation && (
                <TestResults
                  evaluation={evaluation}
                  runtimeEnvironmentId={runtimeEnvironmentId}
                  showJudgeLogStdout
                  showJudgeLogStderr
                  isJudgeLogMerged={exercise.mergeJudgeLogs}
                />
              )}

              {evaluation && (
                <Row>
                  <Col lg={6} md={12}>
                    <DownloadResultArchiveContainer submissionId={restSub.id} isReference={true} />
                  </Col>
                </Row>
              )}
              {activeSubmissionId && (
                <Row>
                  <Col lg={12}>
                    <ResourceRenderer resource={evaluations.toArray()} returnAsArray>
                      {evaluations => (
                        <SubmissionEvaluations
                          submissionId={id}
                          evaluations={evaluations}
                          activeSubmissionId={activeSubmissionId}
                          showInfo={false}
                          onSelect={this.setActiveSubmission}
                          onDelete={permissionHints.deleteEvaluation ? deleteEvaluation : null}
                        />
                      )}
                    </ResourceRenderer>
                  </Col>
                </Row>
              )}
            </Col>
          )}
        </Row>

        <SourceCodeViewerContainer
          solutionId={id}
          files={files}
          openAnotherFile={this.openFile}
          show={openFileId !== null}
          fileId={openFileId}
          fileName={openFileName}
          zipEntry={openZipEntry}
          isReference={true}
          onHide={this.hideFile}
          submittedBy={authorId}
        />

        {activeSubmissionId && scoreConfigSelector && (
          <ScoreConfigInfoDialog
            show={scoreDialogOpened}
            onHide={this.closeScoreDialog}
            scoreConfig={scoreConfigSelector(activeSubmissionId)}
            testResults={evaluation && evaluation.testResults}
            canResubmit={canResubmit}
          />
        )}
      </div>
    );
  }
}

ReferenceSolutionDetail.propTypes = {
  solution: PropTypes.shape({
    id: PropTypes.string.isRequired,
    description: PropTypes.string,
    runtimeEnvironmentId: PropTypes.string,
    note: PropTypes.string,
    lastSubmission: PropTypes.shape({ id: PropTypes.string.isRequired }),
    createdAt: PropTypes.number.isRequired,
    authorId: PropTypes.string.isRequired,
    submissions: PropTypes.array.isRequired,
    visibility: PropTypes.number.isRequired,
    permissionHints: PropTypes.object,
  }).isRequired,
  files: ImmutablePropTypes.map,
  download: PropTypes.func,
  exercise: PropTypes.object.isRequired,
  evaluations: PropTypes.object.isRequired,
  deleteEvaluation: PropTypes.func,
  refreshSolutionEvaluations: PropTypes.func,
  runtimeEnvironments: PropTypes.array,
  scoreConfigSelector: PropTypes.func,
  fetchScoreConfigIfNeeded: PropTypes.func,
  canResubmit: PropTypes.bool,
};

export default ReferenceSolutionDetail;
