/*jshint esversion: 6 */

import React from 'react';

export default class Footer extends React.Component {
  render() {
    return (
          <div style={{position:'absolute',bottom:0, textAlign:'center', fontSize:'small'}}><hr/>This is a technical preview service, not a final version. It may change without prior notice.</div>
    );
  }
}
