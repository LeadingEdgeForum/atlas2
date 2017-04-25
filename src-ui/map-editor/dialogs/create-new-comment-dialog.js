/*jshint esversion: 6 */

var React = require('react');
import {
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  HelpBlock,
  Col,
  Radio,
  Input,
  Modal,
  Button,
  Glyphicon
} from 'react-bootstrap';
var Constants = require('../single-map-constants');
import SingleMapActions from '../single-map-actions';
var _ = require('underscore');


var NewGenericCommentDialog = React.createClass({

  getInitialState: function() {
    return {open: false};
  },

  componentDidMount: function() {
    this.internalState = {};
    this.props.singleMapStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    this.props.singleMapStore.removeChangeListener(this._onChange);
  },

  internalState: {},

  _onChange: function() {
    this.setState(this.props.singleMapStore.getNewCommentDialogState());
  },

  _close: function() {
    SingleMapActions.closeAddCommentDialog();
  },

  _submit: function() {
    this.internalState.mapID = this.props.mapID;
    this.internalState.workspaceID = this.props.workspaceID;
    SingleMapActions.submitAddCommentDialog(_.extend(this.state, this.internalState));
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  render: function() {
    var show = this.state.open;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Add a new comment
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Your comment</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" componentClass="textarea" placeholder="Enter comment" onChange={this._handleDialogChange.bind(this, 'comment')} onKeyDown={this._enterInterceptor} style={{ height: 100 }}/>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Add" onClick={this._submit}>Add</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = NewGenericCommentDialog;
