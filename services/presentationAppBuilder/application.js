/**
 * This module provides an entry point to build the quinoa-presentation-player code
 * The entrypoint can be consumed to handle a webpack-based build process
 * ==========
 * @module quinoa-server/routes/presentationAppBuilder
 */
const React = require('react');
const render = require('react-dom').render;
const Presentation = require('quinoa-presentation-player').default;

// Note: this module needs an html #mount element somewhere in the html in which
// it is invoked.
// todo: parametrize that as function parameter to be cleaner ?
const mountNode = document.getElementById('mount');

/**
 * Handles the rendering of a quinoa-presentation-player-powered presentation
 * @param {object} presentation - the presentation to render
 */
function renderPresentation (presentation) {
  render(React.createElement(Presentation, {presentation: presentation}, null), mountNode);
}
// this is used in all-in-one html representations
// in which presentation's data is stored as a js object
renderPresentation(window.__presentation);

module.exports = renderPresentation;