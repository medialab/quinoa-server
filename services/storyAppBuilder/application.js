const React = require('react');
const render = require('react-dom').render;
const Story = require('quinoa-story-player').default;

const mountNode = document.getElementById('mount');

function renderStory (story) {
  render(React.createElement(Story, {story: story}, null), mountNode);
}

renderStory(window.__story);

module.exports = renderStory;