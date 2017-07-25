/**
 * This module consumes the restory of a quinoa story
 * to bundle the content of an all-in-one html file
 * ========
 * @module quinoa-server/services/storyBundler
 */
const fs = require('fs');
const path = require('path');
const buildPath = path.resolve(__dirname + '/../../builds/story/build.js');
const draft = require('draft-js');
const stateToHTML = require('draft-js-export-html').stateToHTML;
const convertFromRaw = draft.convertFromRaw;

/**
 * Builds simple html code aimed at being parsed by indexing robots (to prevent the "black box" effect of js-related-only content)
 * @param {object} story - the story to parse
 * @return {string} html - the resulting html 
 */
const buildSEOHTML = (story = {metadata: {}}) => {
  const title = story.metadata.title || 'Quinoa story';
  const description = story.metadata.description || '';
  const contents = story.sectionsOrder.map(sectionId => {
    const section = story.sections[sectionId];
    // htmlify notes
    const notes = Object.keys(section.notes)
      .map(noteId => {
        const note = section.notes[noteId];
        return stateToHTML(convertFromRaw(note.editorState));
      });
    // htmlify main content
    const theseContents = section.contents;
    const contentState = convertFromRaw(theseContents);
    // return everything
    return stateToHTML(contentState).concat(notes);
  }).join('\n \n');
  return `
<h1>${title}</h1>
<p>
${description}
</p>
<div>
${contents}
</div>
`;
};

/**
 * Builds metadata for the head of the html output
 * @param {object} story - the story to parse
 * @return {string} html - the resulting html 
 */
const buildMeta = (story = {metadata: {}}) => {
  const title = story.metadata.title ? `
    <title>${story.metadata.title}</title>
    <meta name="DC.Title" content="${story.metadata.title}"/>
    <meta name="twitter:title" content="${story.metadata.title}" />
    <meta name="og:title" content="${story.metadata.title}" />
  ` :  '<title>Quinoa story</title>';
  const description = story.metadata.description ? `
    <meta name="description" content="${story.metadata.description}"/>
    <meta name="DC.Description" content="${story.metadata.description}"/>
    <meta name="og:description" content="${story.metadata.description}" />
    <meta name="twitter:description" content="${story.metadata.description}" />
  ` :  '';
  const authors = story.metadata.authors && story.metadata.authors.length
                  ? 
                  story.metadata.authors.map(author => `
                    <meta name="DC.Creator" content="${author}" />
                    <meta name="author" content="${author}" />`)
                  : '';
  return `
  <meta name    = "DC.Format"
          content = "text/html">
  <meta name    = "DC.Type"
          content = "data story">
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@medialab_ScPo" />
  <meta property="og:url" content="http://www.fonio.surge.sh" />
  <meta name="og:type" content="website" />
  ${title}
  ${authors}
  ${description}
`;
}

/**
 * Builds the restory of a all-in-one html story out of a json story restory
 * @param {object} story - the story to bundle
 * @param {object} options - relative to the settings of the story interactions
 * @return {string} html - the resulting html 
 */
module.exports = function bundleStory (story = {}, options = {}) {
  const presJSON = JSON.stringify(story);
  // build html for indexing purpose
  const seoHTML = buildSEOHTML(story);
  // build metadata html for the head
  const meta = buildMeta(story);
  // retrieve the story-player application js code
  const jsBuild = fs.readFileSync(buildPath, 'utf8').replace(/(^\/\/.*$)/gm, '');
  // render html
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
    .quinoa-story-player{
      background: #f4f4f4;
    }
  </style>
</head>
<body>
  <div class="loader-wrapper">
    <div class="loader-container">
      <h3>Quinoa - by <a href="http://www.medialab.sciences-po.fr/fr/" target="blank">médialab sciences po</a></h3>
      <h1>${story.metadata.title || 'Quinoa story'}</h1>
      <p>Loading ...</p>
    </div>
  </div>
  <div class="shadow-content">
    ${seoHTML}
  </div>
  <div id="mount"></div>
  <script>
    window.__story = ${presJSON}
  </script>
  <script>
    ${jsBuild}
  </script>
</body>
</html>
`
}