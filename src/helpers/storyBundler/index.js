/**
 * This module consumes the restory of a quinoa story
 * to bundle the content of an all-in-one html file
 * ========
 * @module quinoa-server/services/storyBundler
 */
const fs = require('fs');
const path = require('path');
const config = require('config');
const draft = require('draft-js');
// const sizeOf = require('image-size');
const stateToHTML = require('draft-js-export-html').stateToHTML;

const convertFromRaw = draft.convertFromRaw;
const buildsFolder = config.get('buildsFolder');
const buildPath = path.resolve(`${buildsFolder}/story/build.js`);


/**
 * Cover image related code is commented since
 * neither facebook nor twitter accept base64 images in meta.
 * This challenges the very principle of having a all-in-one html
 * @todo find a workaround for image-related metas or drop the feature
 */
// const getBase64ImageDimensions = (base64, mimetype) => {
//   const data = base64.replace(new RegExp(`^data:${mimetype.replace('jpeg', 'jpg')};base64,`), '');
//   const imageData = new Buffer(data, 'base64');
//   try {
//     return sizeOf(imageData);
//   } catch(error) {
//     console.log('error from image-size', error);
//     return {width: 500, height: 500}
//   }
// }

// const buildCoverMeta = (story = {}) => {
//   const {
//     metadata = {},
//     resources = {}
//   } = story;


//   if (metadata.coverImage && metadata.coverImage.resourceId) {
//     if (resources[metadata.coverImage.resourceId]) {
//       const imageRes = resources[metadata.coverImage.resourceId];
//       if (imageRes.data && imageRes.data.base64) {
//         const base64 = imageRes.data.base64;
//         const mimetype = imageRes.metadata.mimetype;
//         // dimensions
//         const dimensions = getBase64ImageDimensions(base64, mimetype);
//         return `
// <meta name="twitter:image" content="${base64}" />
// <meta name="twitter:image:alt" content="${imageRes.metadata.title || ''}" />
// <meta property="og:image" content="${base64}" />
// <meta property="og:image:type" content="${mimetype}" />
// <meta property="og:image:width" content="${dimensions.width}" />
// <meta property="og:image:height" content="${dimensions.height}" />
// `
//       }
//       return '';
//     }
//     return '';
//   }
//   return '';
// }

/**
 * Builds simple html code aimed at being parsed by indexing robots (to prevent the "black box" effect of js-related-only content)
 * @param {object} story - the story to parse
 * @return {string} html - the resulting html
 */
const buildSEOHTML = (story = {metadata: {}}) => {
  const title = story.metadata.title || 'Quinoa story';
  const description = story.metadata.abstract || '';
  let contents = '';
  try {
    contents = story.sectionsOrder.map(sectionId => {
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
  } catch(e) {
    console.error(e);
  }
    

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
    <meta property="og:title" content="${story.metadata.title}" />
  ` :  '<title>Quinoa story</title>';
  const description = story.metadata.abstract ? `
    <meta name="description" content="${story.metadata.abstract}"/>
    <meta name="DC.Description" content="${story.metadata.abstract}"/>
    <meta property="og:description" content="${story.metadata.abstract}" />
    <meta name="twitter:description" content="${story.metadata.abstract}" />
  ` :  '';
  const authors = story.metadata.authors && story.metadata.authors.length
                  ?
                  story.metadata.authors.map(author => `
    <meta name="DC.Creator" content="${author}" />
    <meta name="author" content="${author}" />`
  )
                  : '';
  // const covers = buildCoverMeta(story);
  return `
  <meta name = "DC.Format" content = "text/html">
  <meta name = "DC.Type" content = "data story">
  <meta name = "twitter:card" content="summary" />
  <meta property = "og:type" content="website" />
  ${title}
  ${authors}
  ${description}
`;
}

/**
 * Builds the restory of a all-in-one html story out of a json story restory
 * @param {object} story - the story to bundle
 * @param {object} options - relative to the settings of the story interactions
 * @return {Promise} promise - promise for the resulting html
 */
module.exports = function bundleStory (story = {}, options = {}) {
  return new Promise((resolve, reject) => {
    const storyJSON = JSON.stringify(story);
    const locale = options.locale || 'en';
    // build html for indexing purpose
    const seoHTML = buildSEOHTML(story);
    console.log('3');
    // build metadata html for the head
    let meta;
    try {
      meta = buildMeta(story);
    } catch(error) {
      console.log(error);
      return reject(error);
    }
    console.log('4');

    // retrieve the story-player application js code
    const jsBuild = fs.readFileSync(buildPath, 'utf8').replace(/(^\/\/.*$)/gm, '');
    console.log('5');
    // render html
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
       ${meta}

       <link href="https://fonts.googleapis.com/css?family=Roboto:400,400i,500,500i" rel="stylesheet">
<link href="https://fonts.googleapis.com/css?family=Merriweather:400,400i,700,700i" rel="stylesheet">

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
          left: 0;
          top: 0;
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
      </style>
    </head>
    <body>
      <div class="shadow-content">
        ${seoHTML}
      </div>
      <div class="loader-wrapper">
        <div class="loader-container">
          <h3>Quinoa - by <a href="http://www.medialab.sciences-po.fr/fr/" target="blank">médialab sciences po</a></h3>
          <h1>${story.metadata.title || 'Quinoa story'}</h1>
          <p>Loading ...</p>
        </div>
      </div>
      <div id="mount"></div>
      <script>
        window.__story = ${storyJSON}
        window.__locale = "${locale}";
      </script>
      <script>
        ${jsBuild}
      </script>
    </body>
    </html>
    `;

    resolve(html);
  });
}