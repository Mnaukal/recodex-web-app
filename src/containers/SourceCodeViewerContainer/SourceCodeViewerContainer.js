import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Modal } from 'react-bootstrap';
import Button from '../../components/widgets/FlatButton';
import { DownloadIcon, LoadingIcon } from '../../components/icons';

import { fetchFileIfNeeded, download } from '../../redux/modules/files';
import { fetchContentIfNeeded } from '../../redux/modules/filesContent';
import { getFile, getFilesContent } from '../../redux/selectors/files';
import ResourceRenderer from '../../components/helpers/ResourceRenderer';
import SourceCodeViewer from '../../components/helpers/SourceCodeViewer';

import styles from './sourceCode.less';

class SourceCodeViewerContainer extends Component {
  state = { height: null };

  componentWillMount() {
    const { fileId, loadAsync } = this.props;
    if (fileId !== null) {
      loadAsync();
    }
  }

  componentWillReceiveProps({ fileId, loadAsync }) {
    if (this.props.fileId !== fileId && fileId !== null) {
      loadAsync();
    }
  }

  onModalEntered() {
    if (this.state.height === null) {
      const { headerRef, bodyRef, footerRef } = this;
      const height =
        window.innerHeight -
        headerRef.clientHeight -
        bodyRef.clientHeight -
        footerRef.clientHeight;
      this.setState({ height });
    }
  }

  onModalEnteredWhileLoading() {
    if (this.state.height === null) {
      const { loadingHeaderRef, loadingBodyRef, loadingFooterRef } = this;
      const height =
        window.innerHeight -
        loadingHeaderRef.clientHeight -
        loadingBodyRef.clientHeight -
        loadingFooterRef.clientHeight;
      this.setState({ height });
    } else {
      // console.log('already has height', this.state.height);
    }
  }

  render() {
    const { show, onHide, download, file, code } = this.props;
    const { height } = this.state;
    return (
      <ResourceRenderer
        loading={
          <Modal
            show={show}
            onHide={onHide}
            dialogClassName={styles.modal}
            onEntered={() => this.onModalEnteredWhileLoading()}
          >
            <div ref={header => (this.loadingHeaderRef = header)}>
              <Modal.Header closeButton>
                <Modal.Title>
                  <LoadingIcon />{' '}
                  <FormattedMessage
                    id="app.sourceCodeViewer.loading"
                    defaultMessage="Loading ..."
                  />
                </Modal.Title>
              </Modal.Header>
            </div>
            <div ref={body => (this.loadingBodyRef = body)}>
              <Modal.Body className={styles.modalBody}>
                <SourceCodeViewer content="" name="" />
              </Modal.Body>
            </div>
            <div ref={footer => (this.loadingFooterRef = footer)}>
              <Modal.Footer>
                <Button disabled>
                  <DownloadIcon />{' '}
                  <FormattedMessage
                    id="app.sourceCodeViewer.downloadButton"
                    defaultMessage="Download file"
                  />
                </Button>
              </Modal.Footer>
            </div>
          </Modal>
        }
        resource={[file, code]}
      >
        {(file, code) =>
          <Modal
            show={show}
            onHide={onHide}
            dialogClassName={styles.modal}
            onEntered={() => this.onModalEntered()}
          >
            <div ref={header => (this.headerRef = header)}>
              <Modal.Header closeButton>
                <Modal.Title>
                  {file.name}
                </Modal.Title>
              </Modal.Header>
            </div>
            <div ref={body => (this.bodyRef = body)}>
              <Modal.Body className={styles.modalBody}>
                <SourceCodeViewer
                  content={code}
                  name={file.name}
                  height={height}
                />
              </Modal.Body>
            </div>
            <div ref={footer => (this.footerRef = footer)}>
              <Modal.Footer>
                <Button onClick={() => download(file.id)}>
                  <DownloadIcon />{' '}
                  <FormattedMessage
                    id="app.sourceCodeViewer.downloadButton"
                    defaultMessage="Download file"
                  />
                </Button>
              </Modal.Footer>
            </div>
          </Modal>}
      </ResourceRenderer>
    );
  }
}

SourceCodeViewerContainer.propTypes = {
  fileId: PropTypes.string,
  file: ImmutablePropTypes.map,
  show: PropTypes.bool,
  onHide: PropTypes.func.isRequired,
  loadAsync: PropTypes.func.isRequired,
  download: PropTypes.func.isRequired,
  code: ImmutablePropTypes.map
};

export default connect(
  (state, { fileId }) => ({
    file: getFile(fileId)(state),
    code: getFilesContent(fileId)(state)
  }),
  (dispatch, { fileId }) => ({
    loadAsync: () =>
      Promise.all([
        dispatch(fetchFileIfNeeded(fileId)),
        dispatch(fetchContentIfNeeded(fileId))
      ]),
    download: id => dispatch(download(id))
  })
)(SourceCodeViewerContainer);
