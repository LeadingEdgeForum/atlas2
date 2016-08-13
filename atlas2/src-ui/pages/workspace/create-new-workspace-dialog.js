/*jshint esversion: 6 */

var React = require('react');
var Input = require('react-bootstrap').Input;
var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;
var Glyphicon = require('react-bootstrap').Glyphicon;
var Constants = require('./../../constants');
import Actions from './../../actions.js';
var $ = require('jquery');
var browserHistory = require('react-router').browserHistory;
import WorkspaceStore from './workspace-store';

var CreateNewWorkspaceDialog = React.createClass({
  getInitialState: function() {
    return {open: false};

  },
  componentDidMount: function() {
    WorkspaceStore.addChangeListener(this._onChange.bind(this));
  },

  componentWillUnmount: function() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  },
  _onChange: function() {
    console.log('setting state', WorkspaceStore.isWorkspaceNewDialogOpen());
    this.setState(WorkspaceStore.isWorkspaceNewDialogOpen());
  },
  _close: function() {
    Actions.closeNewWorkspaceDialog();
  },
  _submit: function() {
    Actions.closeNewWorkspaceDialog();
  },
  _handleDialogChange: function(a, b) {
    console.log(a, b);
  },
  render: function() {
    console.log('render', this.state);
    var show = this.state.open;
    console.log(show, this.state);
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
            <form className="form-horizontal"></form>
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
