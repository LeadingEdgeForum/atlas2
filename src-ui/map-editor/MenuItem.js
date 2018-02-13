/* Copyright 2017, 2018  Krzysztof Daniel.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
/*jshint esversion: 6 */
import React from 'react';
import PropTypes from 'prop-types';
import {
  actionEndpointOptions,
  inactiveMenuStyle,
  activeMenuStyle,
  nonInlinedStyle,
  itemCaptionStyle,
  endpointOptions,
  getStyleForType,
  inertiaStyle,
  getElementOffset,
  getInertiaWidth
} from './component-styles';
var _ = require('underscore');
var LinkContainer = require('react-router-bootstrap').LinkContainer;
import {Glyphicon} from 'react-bootstrap';

export default class MenuItem extends React.Component {
  constructor(props){
    super(props);
    this.render = this.render.bind(this);
    this.mouseOver = this.mouseOver.bind(this);
    this.mouseOut = this.mouseOut.bind(this);
    this.onClickHandler = this.onClickHandler.bind(this);
    this.state = {
      hover:false
    };
  }
  mouseOver(){
    this.setState({'hover': true});
    if(this.props.jsPlumbOn){
      this.props.jsPlumbOn();
    }
  }
  mouseOut(){
    this.setState({'hover': false});
    if(this.props.jsPlumbOff){
      this.props.jsPlumbOff();
    }
  }
  onClickHandler(e){
    if(this.props.href){
      // we need to pass the click to the underlying link container
      return;
    }
    // consume the event otherwise
    if(this.props.action && this.state.hover){
      e.preventDefault();
      e.stopPropagation();
      this.props.action();
    }
    this.setState({'hover': false});
  }
  render() {
    if(!this.props.parentFocused){
      return null;
    }
    let menuItemName = this.props.name;
    let glyphicon = this.props.glyph || menuItemName;
    let href = this.props.href;

    let style = _.extend(_.clone(inactiveMenuStyle), this.props.pos);
    if(this.state.hover){
      style = _.extend(style, activeMenuStyle);
    }

    if(this.props.canvasStore.shouldShow(menuItemName)){
      if(this.props.href){
          return <LinkContainer to={href}><a href={href} key={menuItemName}><Glyphicon onMouseOver={this.mouseOver} onMouseOut={this.mouseOut} glyph={glyphicon} key={menuItemName} style={style}/></a></LinkContainer>;
      } else {
          return (<Glyphicon onMouseOver={this.mouseOver} onClick={this.onClickHandler} onMouseOut={this.mouseOut} glyph={glyphicon} key={menuItemName} style={style}/>);
      }
    }
    return null;
  }
}
