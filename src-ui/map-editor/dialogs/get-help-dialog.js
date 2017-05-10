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
  Glyphicon,
  ListGroup,
  ListGroupItem
} from 'react-bootstrap';
import ReactDOM from 'react-dom';

var GetHelpDialog = React.createClass({

  render: function() {
    var show = this.props.open;
    return (
      <div>
        <Modal show={show} onHide={this.props.close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Get help on mapping
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ListGroup>
              <ListGroupItem href="http://learn.leadingedgeforum.com/p/wardley-mapping/?product_id=277424&coupon_code=CDANLAUNCH">
                <h4 class="list-group-item-heading">Enroll in a self-paced, online course</h4>
                <p class="list-group-item-text">An excellent starter to give you all the knowledge you need to start mapping. Click here to learn more!</p>
              </ListGroupItem>
              {/*<ListGroupItem href="http://learn.leadingedgeforum.com/p/wardley-mapping/?product_id=277424&coupon_code=CDANLAUNCH">
                <h4 class="list-group-item-heading">Have your map(s) reviewed</h4>
                <p class="list-group-item-text">If you want to receive feedback on this map, click here to book a session with Chris,
                the creator of this tool.</p>
              </ListGroupItem>
              <ListGroupItem href="http://learn.leadingedgeforum.com/p/wardley-mapping/?product_id=277424&coupon_code=CDANLAUNCH">
                <h4 class="list-group-item-heading">Book a kickstart session</h4>
                <p class="list-group-item-text">Get assistance in mapping your company. You will be able to focus on your business problem instead of wondering, whether your maps are correct.
                Helpful advice will be also at hand, when you need it! Click to request contact!</p>
              </ListGroupItem>*/}
              <ListGroupItem href="http://wardleymaps.com/advanced">
                <h4 class="list-group-item-heading">Premium, on-site workshop</h4>
                <p class="list-group-item-text">A two-day mapping class delivered by mr. Simon Wardley himself, personally, at your premise. Click to learn more!</p>
              </ListGroupItem>
            </ListGroup>
          </Modal.Body>
        </Modal>
      </div>
    );
  }
});

module.exports = GetHelpDialog;
