const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const path = require('path');
const { EnvironmentPlugin } = require('webpack');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'eval-source-map',
    devServer: {
        static: {
            directory: path.join(__dirname, '../../dist/client'),
        },
        hot: false,
        open: true
    },
    plugins:[
        new EnvironmentPlugin({
            DEV_MODE: 'dev'
        })
    ]
})