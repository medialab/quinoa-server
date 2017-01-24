const React = require('react');
const render = require('react-dom').render;
const Presentation = require('quinoa-presentation-player').default;

const mountNode = document.getElementById('mount');

function renderPresentation (presentation) {
  render(React.createElement(Presentation, {presentation: presentation}, null), mountNode);
}

renderPresentation(window.__presentation);

module.exports = renderPresentation;