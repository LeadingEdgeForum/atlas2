/*jshint esversion: 6 */

import React from 'react';
import DocumentTitle from 'react-document-title';

import { LoginForm } from 'react-stormpath';
import Footer from './footer';

export default class LoginPage extends React.Component {
  render() {
    return (
      <DocumentTitle title={`Login`}>
        <div className="container">
          <div className="row">
            <div className="col-xs-12">
              <h3>Login</h3>
              <hr />
            </div>
          </div>
          <LoginForm />
          <Footer/>
        </div>
      </DocumentTitle>
    );
  }
}
