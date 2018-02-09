/*jshint esversion: 6 */

var React = require('react');
import {
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  HelpBlock,
  Col,
  Input,
  Modal,
  Button,
  Glyphicon,
  Radio
} from 'react-bootstrap';
import Actions from './new-action-actions';
var createReactClass = require('create-react-class');

export default class NewActionDialog extends React.Component {
  constructor(props){
    super(props);
    this.render = this.render.bind(this);
    this._close = this._close.bind(this);
    this._submit = this._submit.bind(this);
    this._storeChangeListener = this._storeChangeListener.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.state = this.props.store.getState();
  }

  componentDidMount() {
    this.props.store.addChangeListener(this._storeChangeListener);
  }

  componentWillUnmount() {
    this.props.store.removeChangeListener(this._storeChangeListener);
  }

  _storeChangeListener() {
    this.setState(this.props.store.getState());
  }

  _close() {
    Actions.closeAddActionDialog(this.state.mapId);
  }

  _submit() {
    Actions.submitAddActionDialog(this.state.mapId);
  }

  _enterInterceptor(e) {
    if (e.nativeEvent.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  render() {
    let show = this.state.open;
    let summary = this.state.shortSummary;
    let description = this.state.description;
    let type = this.state.type;

    let summaryChangeHandler = Actions.handleDialogChange.bind(Actions,this.state.mapId, 'shortSummary');
    let descriptionChangeHandler = Actions.handleDialogChange.bind(Actions,this.state.mapId, 'description');
    let typeChangeHandler = Actions.handleDialogChange.bind(Actions,this.state.mapId, 'type');
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Action details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="shortSummary">
                <Col sm={2}>
                  <ControlLabel>Summary</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" value={summary}  placeholder="Enter short summary" onChange={summaryChangeHandler} onKeyDown={this._enterInterceptor}/>
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" value={description} componentClass="textarea" placeholder="Describe this action" onChange={descriptionChangeHandler} onKeyDown={this._enterInterceptor} style={{ height: 100 }}/>
                </Col>
              </FormGroup>
              <FormGroup controlId="type">
                <Col sm={2}>
                  <ControlLabel>Type</ControlLabel>
                </Col>
                <Col sm={9}>
                <Radio inline value={"EFFORT"} checked={ type==="EFFORT" || !type}  onChange={typeChangeHandler}>Effort</Radio>{' '}
                <Radio inline value={"REPLACEMENT"} checked={type==="REPLACEMENT"} onChange={typeChangeHandler}>Replacement</Radio>{' '}
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Save" onClick={this._submit}>Create</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}
