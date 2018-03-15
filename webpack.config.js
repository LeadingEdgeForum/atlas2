/* eslint-disable no-var */
var path = require('path');
var webpack = require('webpack');

var config = require('./config.json');

module.exports = {

    // devtool: 'eval-source-map',

    context: path.join(__dirname, 'src-ui'),

    entry: {
        app: './app',
        'google-app': './google-app', // google
        'l-p-app': './l-p-app', //login password, ldap & anonymous
        'canvas-wrapper': './canvas-wrapper'
    },

    output: {
        path: path.join(__dirname, 'build-ui/js'),
        filename: '[name].js',
        publicPath: '/js'
    },

    module: {
        rules : [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                include: path.join(__dirname, 'src-ui')
            }
        ]
    },

    plugins: [new webpack.DefinePlugin({
        ___AUTH0_AUDIENCE___: process.env.AUTH0_AUDIENCE ? JSON.stringify(process.env.AUTH0_AUDIENCE) : JSON.stringify(config.userProvider.auth0.audience),
        ___AUTH0_ISSUER___: process.env.AUTH0_ISSUER ? JSON.stringify(process.env.AUTH0_ISSUER) : JSON.stringify(config.userProvider.auth0.issuer)
    })],

    target: 'web'
};
