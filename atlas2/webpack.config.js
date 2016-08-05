/* eslint-disable no-var */
var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: [
    './src-ui/app'
  ],
  devtool: 'eval-source-map',
  output: {
    path: path.join(__dirname, 'js-ui'),
    filename: 'app.js',
    publicPath: ''
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      include: path.join(__dirname, 'src-ui')
    }]
  }
};