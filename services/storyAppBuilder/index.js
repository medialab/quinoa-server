const kotatsu = require('kotatsu');
const webpackConfig = require('./webpack.config.js');
const path = require('path');

function buildStoryApplication () {
  console.log('building application');
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