/**
 * This module provides a function for building (transpile/bundle/minify/...)
 * the code of the application to use for providing all-in-one html representations
 * of presentation documents
 * ==========
 * @module quinoa-server/routes/presentationAppBuilder
 */
const kotatsu = require('kotatsu');
const webpackConfig = require('./webpack.config.js');
const path = require('path');

/**
 * Builds a js bundle of the presentation player application 
 * in the builds/presentation project
 */
function buildPresentationApplication () {
  console.log('building the presentation player application');
  // todo : in order to be cleaner put the paths in a config file / in function's arguments ?
  kotatsu.build('front', {
    entry: './services/presentationAppBuilder/application.js',
    config: webpackConfig,
    progress: true,
    minify: true,
    output: path.resolve('./builds/presentation/build.js')
  });
}
// build process is launched at startup
buildPresentationApplication();

module.exports = buildPresentationApplication;