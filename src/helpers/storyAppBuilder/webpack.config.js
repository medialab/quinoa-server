/**
 * Webpack config for building quinoa-story-player
 */

const webpack = require('webpack');
// const UglifyEsPlugin = require('uglify-es-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new UglifyJsPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
         use: [
          {
            loader: 'file-loader',
            options: {
              query: {
                name:'assets/[name].[ext]'
              }
            }
          },
          {
            loader: 'image-webpack-loader',
            options: {
              query: {
                mozjpeg: {
                  progressive: true,
                },
                gifsicle: {
                  interlaced: true,
                },
                optipng: {
                  optimizationLevel: 7,
                }
              }
            }
          }]
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
    ]
  }
};