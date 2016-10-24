import React, { PropTypes } from 'react';
import { FormattedMessage } from 'react-intl';

import {
  FormGroup,
  FormControl,
  ControlLabel,
  HelpBlock
} from 'react-bootstrap';

const SingleUploadField = ({
  input,
  meta: {
    touched,
    error
  },
  label,
  ...props
}) => (
  <FormGroup controlId={input.name} validationState={touched && error ? 'error' : undefined}>
    <ControlLabel>{label}</ControlLabel>
    <FormControl {...input} {...props} type='upload' />
    {touched && error && <HelpBlock>{error}</HelpBlock>}
  </FormGroup>
);

SingleUploadField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({ type: PropTypes.oneOf([FormattedMessage]) })
  ]).isRequired
};

export default SingleUploadField;
