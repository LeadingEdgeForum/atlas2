/* eslint-disable no-var */
var path = require('path');
var webpack = require('webpack');

module.exports = {

  devtool: 'eval-source-map',

  context: path.join(__dirname, 'src-ui'),
  entry: ['./app'],

  output: {
    path: path.join(__dirname, 'build-ui/js'),
    filename: 'app.js',
    publicPath: '/js'
  },
  module: {
    loaders: [
      {
        test: require.resolve('jsplumb'),
        loaders: ['imports?this=>window', 'script']
      }, {
        test: /\.js$/,
        loaders: ['babel'],
        include: path.join(__dirname, 'src-ui')
      }
    ]
  }
};
