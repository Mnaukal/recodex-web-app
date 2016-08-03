
import React, { PropTypes } from 'react';

import { Table } from 'react-bootstrap';
import Box from '../Box';
import { SUBMISSION_DETAIL_URI_FACTORY } from '../../links';

import LoadingSubmissionTableRow from './LoadingSubmissionTableRow';
import NoSolutionYetTableRow from './NoSolutionYetTableRow';
import SuccessfulSubmissionTableRow from './SuccessfulSubmissionTableRow';
import FailedSubmissionTableRow from './FailedSubmissionTableRow';
import NotEvaluatedSubmissionTableRow from './NotEvaluatedSubmissionTableRow';
import EvaluationFailedTableRow from './EvaluationFailedTableRow';

const SubmissionsTable = ({
  assignmentId,
  submissions
}) => (
  <Box title='Odevzdaná řešení' collapsable isOpen={true}>
    <Table responsive>
      <thead>
        <tr>
          <th></th>
          <th>Datum odevzdání</th>
          <th className='text-center'>Úspěšnost řešení</th>
          <th className='text-center'>Počet bodů</th>
          <th>Poznámka</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {!submissions && <LoadingSubmissionTableRow />}
        {!!submissions && submissions.length > 0 &&
          submissions.map(submission => {
            const link = SUBMISSION_DETAIL_URI_FACTORY(assignmentId, submission.id);
            if (!submission.evaluation) {
              return <NotEvaluatedSubmissionTableRow {...submission} key={submission.id} link={link} />;
            }

            if (submission.evaluation.evaluationFailed === true) {
              return <EvaluationFailedTableRow {...submission} key={submission.id} link={link} />;
            }

            if (submission.evaluation.isCorrect === true) {
              return <SuccessfulSubmissionTableRow {...submission} key={submission.id} link={link} />;
            }

            return <FailedSubmissionTableRow {...submission} key={submission.id} link={link} />;
          })}
        {!!submissions && submissions.length === 0 && <NoSolutionYetTableRow />}
      </tbody>
    </Table>
  </Box>
);

SubmissionsTable.propTypes = {
  assignmentId: PropTypes.string.isRequired,
  submissions: PropTypes.array
};

export default SubmissionsTable;