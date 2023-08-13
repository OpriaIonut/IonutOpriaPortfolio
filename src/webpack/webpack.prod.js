const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const { EnvironmentPlugin } = require('webpack');

module.exports = merge(common, {
    mode: 'production',
    performance: {
        hints: false,
    },
    plugins:[
        new EnvironmentPlugin({
            DEV_MODE: 'prod'
        })
    ]
})