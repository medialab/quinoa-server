/**
 * This module consumes the representation of a quinoa presentation
 * to bundle the content of an all-in-one html file
 * @module services/presentationBundler
 */
const fs = require('fs');
const path = require('path');
const buildPath = path.resolve(__dirname + '/../../builds/presentation/build.js');

const buildSEOHTML = (presentation = {metadata: {}, order: [], slides: {}}) => {
  const title = presentation.metadata.title;
  const contents = presentation.order.reduce((html, slideId) => {
    const slide = presentation.slides[slideId];
    return html + `
<h2>${slide.title}</h2>
<p>${slide.markdown}</p>
    `
  }, '');
  return `
<h1>${title}</h1>
${contents}
`;
}

/**
 * Builds the representation of a all-in-one html presentation out of a json presentation representation
 * @param {object} presentation - the presentation to bundle
 * @param {object} options - relative to the settings of the presentation interactions
 * @return {string} html - the resulting html 
 */
module.exports = function bundlePresentation (presentation = {}, options = {}) {
  const presJSON = JSON.stringify(presentation, null, 2);
  const seoHTML = buildSEOHTML(presentation);
  const jsBuild = fs.readFileSync(buildPath, 'utf8');
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${presJSON.metadata ? presJSON.metadata.title: 'Quinoa presentation'}</title>
  <style>
    body{
      position: absolute;
      padding: 0;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="mount"></div>
  ${seoHTML}
  <script>
    window.__presentation = ${presJSON}
    ${jsBuild}
  </script>
</body>
</html>
`
}