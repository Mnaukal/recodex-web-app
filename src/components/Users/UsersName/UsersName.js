import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import Avatar from '../../widgets/Avatar';
import withLinks from '../../../hoc/withLinks';

import styles from './usersName.less';

const UsersName = (
  {
    id,
    fullName,
    avatarUrl,
    size = 25,
    large = false,
    noLink,
    links: { USER_URI_FACTORY }
  }
) => (
  <span className={styles.wrapper}>
    <span className={styles.avatar}>
      <Avatar size={size} src={avatarUrl} title={fullName} />
    </span>
    <span
      className={styles.name}
      style={{
        lineHeight: `${size}px`,
        fontSize: large ? size / 2 : 'inherit',
        marginLeft: large ? 10 : 5
      }}
    >
      {!noLink &&
        <Link to={USER_URI_FACTORY(id)}>
          {fullName}
        </Link>}
      {noLink && <span>{fullName}</span>}
    </span>
  </span>
);

UsersName.propTypes = {
  id: PropTypes.string.isRequired,
  fullName: PropTypes.string.isRequired,
  avatarUrl: PropTypes.string.isRequired,
  size: PropTypes.number,
  large: PropTypes.bool,
  noLink: PropTypes.bool,
  links: PropTypes.object
};

export default withLinks(UsersName);
