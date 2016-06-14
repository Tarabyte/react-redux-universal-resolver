const path = require('path');
const src = path.join(__dirname, '..', 'src');

module.exports = {
  devtool: 'eval',
  resolve: {
    extensions: ['', '.js']
  },
  module: {
    preLoaders: [
      {
        test: /\.(js|jsx)$/,
        loader: 'isparta-instrumenter-loader',
        include: [
          src
        ],
        exclude: /-spec\.(js|jsx)$/
      }
    ],
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        include: [
          src
        ]
      }
    ]
  },
};
