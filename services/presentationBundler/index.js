/**
 * This module consumes the representation of a quinoa presentation
 * to bundle the content of an all-in-one html file
 * @module services/presentationBundler
 */
const fs = require('fs');
const path = require('path');
const buildPath = path.resolve(__dirname + '/../../builds/presentation/build.js');

const buildSEOHTML = (presentation = {metadata: {}, order: [], slides: {}}) => {
  const title = presentation.metadata.title || 'Quinoa presentation';
  const description = presentation.metadata.description || '';
  const contents = presentation.order.reduce((html, slideId) => {
    const slide = presentation.slides[slideId];
    return html + `
<section className="slide">
  <h2>${slide.title}</h2>
  <p>${slide.markdown}</p>
</section>
    `
  }, '');
  return `
<h1>${title}</h1>
<p>${description}</p>
${contents}
`;
};

const buildMeta = (presentation) => {
  const title = presentation.metadata.title ? `
    <title>${presentation.metadata.title}</title>
    <meta name="DC.Title" content="${presentation.metadata.title}"/>
    <meta name="twitter:title" content="${presentation.metadata.title}" />
    <meta name="og:title" content="${presentation.metadata.title}" />
  ` :  '<title>Quinoa presentation</title>';
  const description = presentation.metadata.description ? `
    <meta name="description" content="${presentation.metadata.description}"/>
    <meta name="DC.Description" content="${presentation.metadata.description}"/>
    <meta name="og:description" content="${presentation.metadata.description}" />
    <meta name="twitter:description" content="${presentation.metadata.description}" />
  ` :  '';
  const authors = presentation.metadata.authors && presentation.metadata.authors
                  ? 
                  presentation.metadata.authors.map(author => `
                    <meta name="DC.Creator" content="${author}" />
                    <meta name="author" content="${author}" />`)
                  : '';
  return `
  <meta name    = "DC.Format"
          content = "text/html">
  <meta name    = "DC.Type"
          content = "data presentation">
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@medialab_ScPo" />
  <meta property="og:url" content="http://www.bulgur.surge.sh" />
  <meta name="og:type" content="website" />
  ${title}
  ${authors}
  ${description}
`;
}

/**
 * Builds the representation of a all-in-one html presentation out of a json presentation representation
 * @param {object} presentation - the presentation to bundle
 * @param {object} options - relative to the settings of the presentation interactions
 * @return {string} html - the resulting html 
 */
module.exports = function bundlePresentation (presentation = {}, options = {}) {
  const presJSON = JSON.stringify(presentation);
  const seoHTML = buildSEOHTML(presentation);
  const meta = buildMeta(presentation);
  const jsBuild = fs.readFileSync(buildPath, 'utf8');
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
   ${meta}

   <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro" rel="stylesheet">

  <style>
    body{
      position: absolute;
      padding: 0;
      margin: 0;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      font-family: Source Sans Pro, sans serif;
    }
    .shadow-content
    {
      display: none;
    }
    .loader-wrapper
    {
      background: #353635;
      color: #f4f4f4;
      width: 100%;
      height: 100%;
      position: absolute;
      display: flex;
      flex-flow: row nowrap;
      justify-content: center;
      align-items: center;
    }  
    .loader-container
    {
      display: flex;
      flex-flow: column nowrap;
      justify-content: center;
      align-items: center;
    } 
    a,a:visited,a:active,a:hover{
      color: inherit;
      text-decoration: none;
    } 
    .loader-container h1
    {
      font-size: 6rem;
    }
    .quinoa-presentation-player{
      background: #f4f4f4;
    }
  </style>
</head>
<body>
  <div class="loader-wrapper">
    <div class="loader-container">
      <h3>Quinoa - by <a href="http://www.medialab.sciences-po.fr/fr/" target="blank">médialab sciences po</a></h3>
      <h1>${presentation.metadata.title || 'Quinoa presentation'}</h1>
      <p>Loading ...</p>
    </div>
  </div>
  <div class="shadow-content">
    ${seoHTML}
  </div>
  <div id="mount"></div>
  <script>
    window.__presentation = ${presJSON}
    ${jsBuild}
  </script>
</body>
</html>
`
}