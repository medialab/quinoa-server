const kotatsu = require('kotatsu');
const webpackConfig = require('./webpack.config.js');

function buildPresentationApplication () {
  console.log('building application');
  kotatsu.build('front', {
    entry: './services/presentationAppBuilder/application.js',
    config: webpackConfig,
    progress: true,
    minify: true,
    output: './builds/presentation/build.js'
  });
}

buildPresentationApplication();

module.exports = buildPresentationApplication;