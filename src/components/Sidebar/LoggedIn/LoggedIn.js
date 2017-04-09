import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { FormattedMessage } from 'react-intl';

import { isReady, getJsData } from '../../../redux/helpers/resourceManager';
import MenuTitle from '../../AdminLTE/Sidebar/MenuTitle';
import MenuItem from '../../AdminLTE/Sidebar/MenuItem';

import withLinks from '../../../hoc/withLinks';

const LoggedIn = (
  {
    instances,
    isCollapsed,
    currentUrl,
    links: {
      DASHBOARD_URI,
      INSTANCE_URI_FACTORY,
      BUGS_URL
    }
  }
) => (
  <ul className="sidebar-menu">
    <MenuTitle
      title={
        <FormattedMessage id="app.sidebar.menu.title" defaultMessage="Menu" />
      }
    />
    <MenuItem
      title={
        <FormattedMessage
          id="app.sidebar.menu.dashboard"
          defaultMessage="Dashboard"
        />
      }
      icon="dashboard"
      currentPath={currentUrl}
      link={DASHBOARD_URI}
    />

    {instances &&
      instances.size > 0 &&
      instances
        .toArray()
        .filter(isReady)
        .map(getJsData)
        .map(({ id, name }) => (
          <MenuItem
            key={id}
            title={name}
            icon="university"
            currentPath={currentUrl}
            link={INSTANCE_URI_FACTORY(id)}
          />
        ))}

    <MenuItem
      title={
        <FormattedMessage
          id="app.sidebar.menu.feedbackAndBugs"
          defaultMessage="Feedback and bug reporting"
        />
      }
      isActive={false}
      icon="bug"
      link={BUGS_URL}
      currentPath={currentUrl}
      inNewTab={true}
    />
  </ul>
);

LoggedIn.propTypes = {
  instances: ImmutablePropTypes.list,
  isCollapsed: PropTypes.bool,
  currentUrl: PropTypes.string.isRequired,
  links: PropTypes.object
};

export default withLinks(LoggedIn);
