const common = require('./webpack.common')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const sassCompiler = require('./sass-compiler')
const merge = require('webpack-merge')

const dev = merge(common, {
    module: {
      rules: [
        sassCompiler(MiniCssExtractPlugin, true, true, false)
      ]
    },
    devtool: 'cheap-eval-source-map',
    devServer: {
      overlay: true,
      publicPath: '/assets/dist',
      contentBase: './src',
      watchContentBase: true,
      host: process.env.HOST || 'localhost'
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "[name].css",
        chunkFilename: "[id].[name].css"
      })
    ]
  }
)

module.exports = dev;