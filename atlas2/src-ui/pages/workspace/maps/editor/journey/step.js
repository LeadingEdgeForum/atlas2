/*jshint esversion: 6 */

const _ = require('underscore');
import {
  Button,
  Glyphicon,
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  HelpBlock,
  Col,
  Checkbox
} from 'react-bootstrap';
var Modal = require('react-bootstrap').Modal;
const React = require('react');

import {PropTypes} from 'react';
import Actions from '../../../../../actions';

var journeyStyle = {
  color:'black',
  maxWidth : 200,
}
var highlightStyle = {
    color: "#00789b",
    borderColor: "#00789b",
    boxShadow: "0 0 10px #00789b",
    cursor:'pointer'
}

export default class Step extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hover:false,open:false, interaction:this.props.step.interaction, stepname:this.props.step.name};
    this.render = this.render.bind(this);
    this.onMouseEnterHandler = this.onMouseEnterHandler.bind(this);
    this.onMouseLeaveHandler = this.onMouseLeaveHandler.bind(this);
    this.onClick = this.onClick.bind(this);
    this.saveStep = this.saveStep.bind(this);
    this.deleteStep = this.deleteStep.bind(this);
    this.hideDialog = this.hideDialog.bind(this);
    this._handleStepChange = this._handleStepChange.bind(this);
    this._handleInteractionChange = this._handleInteractionChange.bind(this);
  }

  onMouseEnterHandler(){
    this.setState({hover:true});
  }

  onMouseLeaveHandler(){
    this.setState({hover:false});
  }

  onClick(){
    this.setState({open:true});
  }

  saveStep(){
    Actions.saveJourneyStep({
      mapID : this.props.mapID,
      stepID : this.props.step._id,
      name : this.state.stepname,
      interaction : this.state.interaction
    });
    // this is cheating as dialog should close only after the action is successful and the maps are updated
    this.setState({open:false});
  }
  deleteStep(){
    Actions.deleteJourneyStep({
      mapID : this.props.mapID,
      stepID : this.props.step._id
    });
    // this is cheating as dialog should close only after the action is successful and the maps are updated
    this.setState({open:false});
  }
  hideDialog(){
    this.setState({open:false});
  }
  _handleStepChange(event){
    var stepname = event.target.value;
    this.setState({stepname:stepname});
  }
  _handleInteractionChange(event){
    var interaction = event.target.checked;
    this.setState({interaction:interaction});
  }
  render() {
      var styleToSet = _.clone(journeyStyle);
      var text = "";
      if(this.state.hover){
        styleToSet = _.extend(styleToSet, highlightStyle);
      }
      var stepName = this.props.step.name;
      var interaction = this.props.step.interaction ? <Glyphicon glyph="flash"/> : null;

      return (<span>
        <Modal show={this.state.open} onHide={this.hideDialog}>
          <Modal.Header closeButton>
            <Modal.Title>Edit existing step</Modal.Title>
            </Modal.Header>
          <Modal.Body>
          <Form horizontal>
            <FormGroup controlId="stepname">
              <Col sm={2}>
                <ControlLabel>Step</ControlLabel>
              </Col>
              <Col sm={9}>
                <FormControl type="text" placeholder="Describe the user step" onChange={this._handleStepChange} value={this.state.stepname}/>
                <HelpBlock>f.e. '<i>Research available hotels</i>'</HelpBlock>
              </Col>
            </FormGroup>
            <FormGroup controlId="interaction">
              <Col sm={2}>
              </Col>
              <Col sm={9}>
                <Checkbox onChange={this._handleInteractionChange} checked={this.state.interaction}>This is point of interaction.</Checkbox>
              </Col>
            </FormGroup>
          </Form>
          </Modal.Body>
          <Modal.Footer>
          <Button onClick={this.deleteStep.bind(this)}>Delete</Button>
          <Button onClick={this.saveStep.bind(this)}>Save</Button>
        </Modal.Footer>
        </Modal>
          <span style={styleToSet}
                  onMouseEnter={this.onMouseEnterHandler.bind(this)}
                  onMouseLeave={this.onMouseLeaveHandler.bind(this)}
                  onClick={this.onClick.bind(this)}>
            {stepName}{interaction}
          </span>
      </span>);
  }
}
