const path = require('path');
const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  watchOptions: {
    aggregateTimeout: 50,
    poll: 100,
  },
  plugins: [
      // new HtmlWebpackPlugin({
      //   title: 'Hot Module Replacement',
      // }),
    // new webpack.HotModuleReplacementPlugin(),
  ],
    // context: path.join(__dirname, 'your-app'),
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'static' }
            ]
        })
    ]
};