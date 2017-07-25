/**
 * This module provides a function for building (transpile/bundle/minify/...)
 * the code of the application to use for providing all-in-one html representations
 * of story documents
 * ==========
 * @module quinoa-server/routes/storyAppBuilder
 */
const kotatsu = require('kotatsu');
const webpackConfig = require('./webpack.config.js');
const path = require('path');

/**
 * Builds a js bundle of the story player application 
 * in the builds/story project
 */
function buildStoryApplication () {
  console.log('building the story player application');
  // todo : in order to be cleaner put the paths in a config file / in function's arguments ?
  kotatsu.build('front', {
    entry: './services/storyAppBuilder/application.js',
    config: webpackConfig,
    progress: true,
    // minify: true,
    output: path.resolve('./builds/story/build.js')
  });
}

buildStoryApplication();

module.exports = buildStoryApplication;