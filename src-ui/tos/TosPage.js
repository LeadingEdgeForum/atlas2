/*jshint esversion: 6 */

import React from 'react';
import ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import {
  Grid,
  Row,
  Col,
  PageHeader,
  ListGroup,
  ListGroupItem
} from 'react-bootstrap';
import AtlasNavbar from '../atlas-navbar.js';
import $ from 'jquery';

export default class WorkspaceListPage extends React.Component {
  constructor(props) {
    super(props);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.state = {termsOfService:null};
  }

  componentDidMount(){
    $.get('/api/tos/', function(result) {
      this.setState(result);
    }.bind(this));
  }
  render() {
    if(!this.state.termsOfService){
      return (
      <DocumentTitle title='Loading...'>
        <Grid fluid={true}>
          <Row >
            <Col xs={16} md={16} >
              <AtlasNavbar/>
            </Col>
          </Row>
          <Row >
            <Col xs={16} md={16} >
              Wait patiently...
            </Col>
          </Row>
        </Grid>
      </DocumentTitle>);
    }
    let header = <PageHeader>{this.state.termsOfService.title}<small>  Last changed: {this.state.termsOfService.lastModified}</small></PageHeader>;
    let prefaceText = [];
    for(let i = 0; i < this.state.termsOfService.preface.length; i++){
      prefaceText.push(<p>{this.state.termsOfService.preface[i]}</p>);
    }
    let chapters = [];
    for(let i = 0; i < this.state.termsOfService.chapters.length; i++){
      let chapter = this.state.termsOfService.chapters[i];
      let chapterText = [];
      for(let j = 0; j < chapter.content.length; j++){
        chapterText.push(<p>{chapter.content[j]}</p>);
      }
      chapters.push(<ListGroupItem header={chapter.title}>{chapterText}</ListGroupItem>);
    }
    return (
      <DocumentTitle title='Atlas2 Terms of Service'>
        <Grid fluid={true}>
          <Row >
            <Col xs={12} md={8} mdOffset={2}>
              <AtlasNavbar/>
            </Col>
          </Row>
          <Row>
            <Col xs={12} md={8} mdOffset={2}>
              {header}
            </Col>
          </Row>
          <Row>
            <Col xs={12} md={8} mdOffset={2}>
              <ListGroup>
                <ListGroupItem>{prefaceText}</ListGroupItem>
                {chapters}
              </ListGroup>
            </Col>
          </Row>
        </Grid>
      </DocumentTitle>
    );
  }
}
