/*jshint esversion: 6 */

var React = require('react');
var Input = require('react-bootstrap').Input;
var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;
import {
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  HelpBlock,
  Col
} from 'react-bootstrap';
var Glyphicon = require('react-bootstrap').Glyphicon;
var Constants = require('./../../constants');
import Actions from './../../actions.js';
var $ = require('jquery');
var browserHistory = require('react-router').browserHistory;
import WorkspaceStore from './workspace-store';

//TODO: validation of the workspace dialog

var CreateNewWorkspaceDialog = React.createClass({
  getInitialState: function() {
    return {open: false};
  },

  componentDidMount: function() {
    this.internalState = {};
    WorkspaceStore.addChangeListener(this._onChange.bind(this));
  },

  componentWillUnmount: function() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  },
  internalState: {},
  _onChange: function() {
    this.setState(WorkspaceStore.isWorkspaceNewDialogOpen());
  },
  _close: function() {
    Actions.closeNewWorkspaceDialog();
  },
  _submit: function() {
    Actions.submitNewWorkspaceDialog(this.internalState);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    console.log(this.internalState);
  },
  render: function() {
    var show = this.state.open;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Create a new workspace
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Workspace is a place where maps can be analized together.
            </p>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter name (at least 5 characters)" onChange={this._handleDialogChange.bind(this, 'name')}/>
                  <HelpBlock>Name of the workspace</HelpBlock>
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter description (this is optional, but usefull)" onChange={this._handleDialogChange.bind(this, 'description')}/>
                  <HelpBlock>Description of the workspace</HelpBlock>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Create</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = CreateNewWorkspaceDialog;

//   onSubmit : function(key){
//     var self = this;
//     $.ajax({
//         type : 'POST',
//         url : '/api/map/',
//         dataType : 'json',
//         data : self.internalState,
//         success : function(data) {
//             browserHistory.push('/map/' + data.mapid);
//             self.props.closeFunction();
//         }
//     });
//     key.preventDefault();
//     key.stopPropagation();
//     return false;
//   },
//
//   render: function() {
//     var show = this.props.store.getState().visibleDialog === 'CreateNewMapDialog';
//
//     return (
//       <Modal show={show} onHide={this.close}>
//         <Modal.Header closeButton>
//           <Modal.Title>
//             Create a new map
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <form className="form-horizontal">
//             <Input type="text" label="Title" labelClassName="col-xs-2" wrapperClassName="col-xs-10" onChange={this.handleChange.bind(this, 'name')}/>
//             <Input type="textarea" label="Description" labelClassName="col-xs-2" wrapperClassName="col-xs-10" onChange={this.handleChange.bind(this, 'description')}/>
//           </form>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button type="reset"  onClick={this.close}>Cancel</Button>
//           <Button type="submit" bsStyle="primary" value="Create" onClick={this.onSubmit}>Create</Button>
//         </Modal.Footer>
//       </Modal>
//     );
//   },
//   handleChange: function(field, e) {
//     this.internalState[field] = e.target.value;
//   },
// this.internalState[field] = e.target.value;
//   },
// Modal.Footer >
// //       </Modal>
// //     );
// //}, // handleChange: function(field, e) {//     this.internalState[field] = e.target.value;
// //}
// // this.internalState[field] = e.target.value; // }, Modal.Footer> // < /Modal>
// // ); //}, // handleChange: function(field, e) {//     this.internalState[field] = e.target.value;
// //}
// e;
// //}
// // this.internalState[field] = e.target.value; // }, Modal.Footer> //
// </Modal >
// ); //}, // handleChange: function(field, e) {//     this.internalState[field] = e.target.value;
//}

//   handleChange: function(field, e) {
//     this.internalState[field] = e.target.value;
//   },
// this.internalState[field] = e.target.value;
//   },
// Modal.Footer >
// //       </Modal>
// //     );
// //}, // handleChange: function(field, e) {//     this.internalState[field] = e.target.value;
// //}
// // this.internalState[field] = e.target.value; // }, Modal.Footer> // < /Modal>
// // ); //}, // handleChange: function(field, e) {//     this.internalState[field] = e.target.value;
// //}
// e;
// //}
// // this.internalState[field] = e.target.value; // }, Modal.Footer> //
// </Modal >
// ); //}, // handleChange: function(field, e) {//     this.internalState[field] = e.target.value;
//}
