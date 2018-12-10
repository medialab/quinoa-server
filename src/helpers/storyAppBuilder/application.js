/**
 * This module provides an entry point to build the quinoa-story-player code
 * The entrypoint can be consumed to handle a webpack-based build process
 * ==========
 * @module quinoa-server/routes/storyAppBuilder
 */
const React = require('react');
const render = require('react-dom').render;
const Story = require('quinoa-story-player').default;

// Note: this module needs an html #mount element somewhere in the html in which
// it is invoked.
// todo: parametrize that as function parameter to be cleaner ?
const mountNode = document.getElementById('mount');

/**
 * Handles the rendering of a quinoa-story-player-powered story
 * @param {object} story - the story to render
 */
function renderStory (story, locale) {
  console.log('render with locale', locale);
  render(React.createElement(Story, {story: story, locale: locale, previewMode: false}, null), mountNode);
}
// this is used in all-in-one html representations
// in which story's data is stored as a js object
renderStory(window.__story, window.__locale);

module.exports = renderStory;