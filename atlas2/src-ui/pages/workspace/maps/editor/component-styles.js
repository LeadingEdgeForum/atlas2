/*jshint esversion: 6 */

var _ = require('underscore');

var _diameter = 10;
var mapComponentStyle = {
  minHeight: _diameter,
  minWidth: _diameter,
  maxWidth: _diameter,
  maxHeight: _diameter,
  borderRadius: _diameter / 2,
  zIndex: 5,
  border: '3px solid black',
  backgroundColor: 'silver',
  float: 'left'
};

var userNeedStyle = _.extend(_.clone(mapComponentStyle), {
  border: '3px solid #00789b',
  backgroundColor: '#00789b'
});
var externalStyle = _.extend(_.clone(mapComponentStyle), {
  border: '1px solid black',
  backgroundColor: 'silver'
});
var internalStyle = _.extend(_.clone(mapComponentStyle), {
  border: '1px solid black',
  backgroundColor: 'white'
});

export {userNeedStyle, externalStyle, internalStyle};
