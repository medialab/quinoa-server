const kotatsu = require('kotatsu');
const webpackConfig = require('./webpack.config.js');
const path = require('path');

function buildPresentationApplication () {
  console.log('building application');
  kotatsu.build('front', {
    entry: './services/presentationAppBuilder/application.js',
    config: webpackConfig,
    progress: true,
    minify: true,
    output: path.resolve('./builds/presentation/build.js')
  });
}

buildPresentationApplication();

module.exports = buildPresentationApplication;