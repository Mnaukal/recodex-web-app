import chai, { expect } from 'chai';
import chaiImmutable from 'chai-immutable';
chai.use(chaiImmutable);

import reducer, {
  submissionStatus,
  actionTypes,
  initialState,

  init,
  changeNote,
  addFile,
  removeFile,
  removeFailedFile,
  returnFile,
  uploadFailed,
  uploadSuccessful
} from '../../../src/redux/modules/submission';

import { Map, List } from 'immutable';

describe('Submission of user\'s solution', () => {
  describe('(Action creators)', () => {

    it('must initialize the submission', () => {
      const userId = 'abcdefg', assignmentId = 'yzsdalkj';
      expect(init(userId, assignmentId)).to.eql({
        type: actionTypes.INIT,
        payload: { userId, assignmentId }
      });
    });

    it('must place the note in the payload', () => {
      const note = 'bla bla bla';
      expect(changeNote(note)).to.eql({
        type: actionTypes.CHANGE_NOTE,
        payload: note
      });
    });

    it('must add one file', () => {
      const file = { name: 'XYZ.jpg', size: 123456789 };
      expect(addFile(file)).to.eql({
        type: actionTypes.ADD_FILE,
        payload: file
      });
    });

    it('must remove one file', () => {
      const file = { name: 'XYZ.jpg', size: 123456789 };
      expect(removeFile(file)).to.eql({
        type: actionTypes.REMOVE_FILE,
        payload: file
      });
    });

    it('must mark file as successfully uploaded', () => {
      const file = { name: 'XYZ.jpg', size: 123456789 };
      expect(uploadSuccessful(file)).to.eql({
        type: actionTypes.MARK_FILE_UPLOADED,
        payload: file
      });
    });

    it('must mark file as unsuccessfully uploaded', () => {
      const file = { name: 'XYZ.jpg', size: 123456789 };
      expect(uploadFailed(file)).to.eql({
        type: actionTypes.MARK_FILE_FAILED,
        payload: file
      });
    });

  });


  describe('(Reducer)', () => {
    it('must have correct initial state', () => {
      const state = reducer(undefined, {});
      expect(state).to.equal(initialState);
      expect(state).to.be.an('object');
      expect(state).to.be.an.instanceof(Map);
      expect(state).to.equal(Map({
        userId: null,
        assignmentId: null,
        submittedOn: null,
        note: '',
        files: Map({
          uploading: List(),
          failed: List(),
          removed: List(),
          uploaded: List()
        }),
        status: submissionStatus.NONE,
        warningMsg: null
      }));
    });

    it('must initialize the state with user and assignment IDs', () => {
      const userId = 'asdad123', assignmentId = 'asdajhaskjh45655';
      const state = reducer(initialState, init(userId, assignmentId));
      expect(state).to.equal(Map({
        userId,
        assignmentId,
        submittedOn: null,
        note: '',
        files: Map({
          uploading: List(),
          failed: List(),
          removed: List(),
          uploaded: List()
        }),
        status: submissionStatus.CREATING,
        warningMsg: null
      }));
    });


    it('must initialize the state with user and assignment IDs even when the state is not the initial state', () => {
      const userId = 'asdad123', assignmentId = 'asdajhaskjh45655';
      const oldState = Map({
        userId,
        assignmentId,
        submittedOn: null,
        note: '',
        files: Map({
          uploading: List([ 'a', 'b', 'c' ]),
          failed: List(),
          removed: List(),
          uploaded: List()
        }),
        status: submissionStatus.PROCESSING,
        warningMsg: 'This is not gonna end well!'
      });

      const state = reducer(oldState, init(userId, assignmentId));
      expect(state).to.equal(Map({
        userId,
        assignmentId,
        submittedOn: null,
        note: '',
        files: Map({
          uploading: List(),
          failed: List(),
          removed: List(),
          uploaded: List()
        }),
        status: submissionStatus.CREATING,
        warningMsg: null
      }));
    });

    it('must change the note of the state and nothing else', () => {
      const note = 'bla bla bla', action = changeNote(note);
      const state = reducer(initialState, action);
      expect(state.get('note')).to.equal(note);
      expect(state.set('note', '')).to.equal(initialState);
    });

    it('must add file among other files for upload', () => {
      const file = { name: 'XYZ.jpg', size: 123456789 };
      const action = addFile(file);
      const state = reducer(initialState, action);
      const filesToUpload = state.getIn(['files', 'uploading']);
      expect(filesToUpload).to.be.an.instanceof(List);
      expect(filesToUpload.size).to.equal(1);
      expect(filesToUpload.first()).to.equal(file);
    });

    it('must mark file as uploaded', () => {
      const file = { name: 'XYZ.jpg', size: 123456789 };
      const action = addFile(file);
      let state = reducer(initialState, action);
      state = reducer(state, uploadSuccessful(file));
      const filesToUpload = state.getIn(['files', 'uploading']);
      const uploadedFiles = state.getIn(['files', 'uploaded']);

      expect(filesToUpload).to.be.an.instanceof(List);
      expect(filesToUpload.size).to.equal(0);

      expect(uploadedFiles).to.be.an.instanceof(List);
      expect(uploadedFiles.size).to.equal(1);
      expect(uploadedFiles.first()).to.equal(file);
    });

    it('must mark file as failed', () => {
      const file = { name: 'XYZ.jpg', size: 123456789 };
      const action = addFile(file);
      let state = reducer(initialState, action);
      state = reducer(state, uploadFailed(file));
      const filesToUpload = state.getIn(['files', 'uploading']);
      const failedFiles = state.getIn(['files', 'failed']);

      expect(filesToUpload).to.be.an.instanceof(List);
      expect(filesToUpload.size).to.equal(0);

      expect(failedFiles).to.be.an.instanceof(List);
      expect(failedFiles.size).to.equal(1);
      expect(failedFiles.first()).to.equal(file);
    });

    it('must remove file from the list of uploaded files and add it to the list of removed files', () => {
      const file = { name: 'XYZ.jpg', size: 123456789 };
      let state = reducer(initialState, addFile(file));
      state = reducer(state, uploadSuccessful(file));

      // now that the file is in the list, remove it!
      state = reducer(state, removeFile(file));
      const uploadedFiles = state.getIn([ 'files', 'uploaded' ]);
      const removedFiles = state.getIn([ 'files', 'removed' ]);
      expect(uploadedFiles.size).to.equal(0);
      expect(removedFiles.size).to.equal(1);
      expect(removedFiles.first()).to.eql(file);
    });

    it('must return a removed uploaded file among the other uploaded files', () => {
      const file = { name: 'XYZ.jpg', size: 123456789 };
      let state = reducer(initialState, addFile(file));
      state = reducer(state, uploadSuccessful(file));
      state = reducer(state, removeFile(file));

      // now that the file is removed, return it back
      state = reducer(state, returnFile(file));
      const removedFiles = state.getIn([ 'files', 'removed' ]);
      const uploadedFiles = state.getIn([ 'files', 'uploaded' ]);
      expect(removedFiles.size).to.equal(0);
      expect(uploadedFiles.size).to.equal(1);
      expect(uploadedFiles.first()).to.eql(file);
    });

    it('must remove file from the list of failed files and throw it away definitelly', () => {
      const file = { name: 'XYZ.jpg', size: 123456789 };
      let state = reducer(initialState, addFile(file));
      state = reducer(state, uploadFailed(file));

      // now that the file is in the list, remove it!
      state = reducer(state, removeFailedFile(file));
      const failedFiles = state.getIn([ 'files', 'failed' ]);
      expect(failedFiles.size).to.equal(0);
    });
  });
});
