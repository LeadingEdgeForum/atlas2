import { Link } from 'react-router';
import React, { PropTypes } from 'react';
import DocumentTitle from 'react-document-title';

import Header from './Header';
import { LoginLink } from 'react-stormpath';

export default class MasterPage extends React.Component {
  render() {
    return (
      <DocumentTitle title='Stormpath Express + React Example'>
        <div className='MasterPage'>
          <Header />
          { this.props.children }
        </div>
      </DocumentTitle>
    );
  }
}