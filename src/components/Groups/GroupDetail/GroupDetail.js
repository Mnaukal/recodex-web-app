import React, { PropTypes } from 'react';
import Icon from 'react-fontawesome';
import { FormattedMessage } from 'react-intl';
import { Row, Col, Button } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import UsersList from '../../Users/UsersList';
import SupervisorsList from '../../Users/SupervisorsList';
import StudentsList from '../../Users/StudentsList';
import Box from '../../AdminLTE/Box';

import LeaveJoinGroupButtonContainer from '../../../containers/LeaveJoinGroupButtonContainer';
import MakeRemoveSupervisorButtonContainer from '../../../containers/MakeRemoveSupervisorButtonContainer';
import AssignmentsTable from '../../Assignments/Assignment/AssignmentsTable';
import { isReady, isLoading, hasFailed } from '../../../redux/helpers/resourceManager';

const GroupDetail = ({
  group: { data },
  supervisors,
  students,
  admin,
  assignments,
  isSupervisor,
  isAdmin,
  stats
}) => (
  <div>
    <ReactMarkdown source={data.description} />
    <Row>
      <Col sm={6}>
        <p>
          {(isSupervisor || isAdmin)
            ? (
              <Button className='btn-flat'>
                <Icon name='plus' /> <FormattedMessage id='app.createAssignment.title' defaultMessage='Create new assignment' />
              </Button>
            )
            : <LeaveJoinGroupButtonContainer groupId={data.id} />}
        </p>
      </Col>
    </Row>
    <Row>
      <Col lg={6}>
        <Box
          title={<FormattedMessage id='app.groupDetail.supervisors' defaultMessage='Supervisors' />}
          collapsable
          isOpen>
          <SupervisorsList users={supervisors} fill isAdmin={isAdmin} groupId={data.id} />
        </Box>

        {(isSupervisor || isAdmin) && (
          <Box
            title={<FormattedMessage id='app.groupDetail.students' defaultMessage='Students' />}
            collapsable
            isOpen={false}>
            <StudentsList users={students} stats={stats} fill />
          </Box>
        )}
      </Col>

      <Col lg={6}>
        <Box
          title={<FormattedMessage id='app.groupDetail.assignments' defaultMessage='Assignments' />}
          collapsable
          isOpen>
          <AssignmentsTable
            assignments={assignments}
            showGroup={false} />
        </Box>
      </Col>
    </Row>
  </div>
);

export default GroupDetail;
