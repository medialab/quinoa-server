/**
 * This module consumes the restory of a quinoa story
 * to bundle the content of an all-in-one html file
 * ========
 * @module quinoa-server/services/storyBundler
 */
const fs = require('fs-extra');
const path = require('path');
const config = require('config');
const draft = require('draft-js');
const genId = require('uuid').v4;
// const sizeOf = require('image-size');
const stateToHTML = require('draft-js-export-html').stateToHTML;
const archiver = require('archiver');

const convertFromRaw = draft.convertFromRaw;
const buildsFolder = config.get('buildsFolder');
const buildPath = path.resolve(`${buildsFolder}/story/build.js`);

const tempFolderPath = path.resolve(__dirname + '/../../../temp');
const dataPath = path.resolve(__dirname + '/../../../data');
const readmeFrPath = path.resolve(__dirname + '/../../../resources/export-readmes/README.fr.md');
const readmeEnPath = path.resolve(__dirname + '/../../../resources/export-readmes/README.en.md');


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
const bundleStoryAsSingleFile = (story = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    const storyJSON = JSON.stringify(story);
    const locale = options.locale || 'en';
    // build html for indexing purpose
    const seoHTML = buildSEOHTML(story);
    // build metadata html for the head
    let meta;
    try {
      meta = buildMeta(story);
    } catch(error) {
      console.log(error);
      return reject(error);
    }

    // retrieve the story-player application js code
    const jsBuild = fs.readFileSync(buildPath, 'utf8').replace(/(^\/\/.*$)/gm, '');
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
          <h3>Fonio - by <a href="http://www.medialab.sciences-po.fr/fr/" target="blank">médialab sciences po</a></h3>
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

const statifyStory = story => {
  return Object.assign(story, {
    resources: Object.keys(story.resources).reduce((res, resourceId) => {
      const resource = story.resources[resourceId];
      let newResource;
      if (resource.data && resource.data.filePath) {
        const filePath = resource.data.filePath.split('/').slice(2).join('/')
        newResource = Object.assign(resource, {
          data: Object.assign(resource.data, {
            filePath,
            src: filePath
          })
        })
      } else newResource = resource;
      return Object.assign(res, {
        [resourceId]: newResource
      })
    }, {})
  })
}

const bundleStoryAsMultipleFiles = (story = {}, options = {}) => {
  const staticStory = statifyStory(story);
  return new Promise((resolve, reject) => {
    // build metadata html for the head
    let meta;
    try {
      meta = buildMeta(story);
    } catch(error) {
      console.log(error);
      return reject(error);
    }
    const storyJSON = JSON.stringify(staticStory);
    const jobId = genId();
    const jobFolderPath = `${tempFolderPath}/${jobId}`;
    const jobZipPath = `${jobFolderPath}/${jobId}.zip`;
    const jobTempPath = `${jobFolderPath}/temp`;
    const locale = options.locale || 'en';
    // build html for indexing purpose
    const seoHTML = buildSEOHTML(story);

    // retrieve the story-player application js code
    const bundle = fs.readFileSync(buildPath, 'utf8').replace(/(^\/\/.*$)/gm, '');

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
          <h3>Fonio - by <a href="http://www.medialab.sciences-po.fr/fr/" target="blank">médialab sciences po</a></h3>
          <h1>${story.metadata.title || 'Quinoa story'}</h1>
          <p>Loading ...</p>
        </div>
      </div>
      <div id="mount"></div>
      <script>
        window.__locale = "${locale}";
        
        function loadJS(url, location){
          //url is URL of external file, implementationCode is the code
          //to be called from the file, location is the location to 
          //insert the <script> element

          var scriptTag = document.createElement('script');
          scriptTag.src = url;
          location.appendChild(scriptTag);
      };
      function loadJSON(URL, callback) {   

        var xobj = new XMLHttpRequest();
            xobj.overrideMimeType("application/json");
        xobj.open('GET', URL, true); // Replace 'my_data' with the path to your file
        xobj.onreadystatechange = function () {
              if (xobj.readyState == 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
              }
        };
        xobj.send(null);  
     }
     function prepareStory(story, prefix) {
       return Object.assign(story, {
         resources: Object.keys(story.resources).reduce(function(res, resourceId) {
            var resource = story.resources[resourceId];
            var newResource;
            if (resource.data && resource.data.filePath) {
              newResource = Object.assign(resource, {
                data: Object.assign(resource.data, {
                  src: prefix + resource.data.filePath,
                  filePath: prefix + resource.data.filePath
                })
              })
            } else newResource = resource;
            return Object.assign(res, {
              [resourceId]: newResource
            })
         }, {})
       })
     }
      var urlPrefix = window.location.href.split('#')[0];
      window.__urlPrefix = urlPrefix;
      /**
       * Dynamically loading the JSON data
       */
      loadJSON(urlPrefix + 'story.json', function(story) {
        window.__story = prepareStory(JSON.parse(story), urlPrefix);
        /**
         * Dynamically loading the html bundle 
         */
        var bundleURL = urlPrefix + 'bundle.js';
        loadJS(bundleURL, document.body);
      })
      
      </script>
    </body>
    </html>
    `;
    Promise.resolve()
    .then(() => fs.ensureDir(jobTempPath))
    .then(() => fs.copy(readmeFrPath, `${jobTempPath}/LISEZ-MOI.txt`))
    .then(() => fs.copy(readmeEnPath, `${jobTempPath}/README.txt`))
    .then(() => fs.copy(readmeFrPath, `${jobTempPath}/LISEZ-MOI.md`))
    .then(() => fs.copy(readmeEnPath, `${jobTempPath}/README.md`))
    .then(() => fs.copy(`${dataPath}/stories/${story.id}/resources`, `${jobTempPath}/resources`))
    .then(() => fs.writeFile(`${jobTempPath}/story.json`, storyJSON, 'utf8'))
    .then(() => fs.writeFile(`${jobTempPath}/bundle.js`, bundle), 'utf8')
    .then(() => fs.writeFile(`${jobTempPath}/index.html`, html, 'utf8'))
    .then( () => {
      return new Promise( ( res1, rej1 ) => {
          const output = fs.createWriteStream( jobZipPath );
          const archive = archiver( 'zip', {
            zlib: { level: 9 } // Sets the compression level.
          } );
          archive.directory( jobTempPath, false );

          /*
          * listen for all archive data to be written
          * 'close' event is fired only when a file descriptor is involved
          */
          output.on( 'close', function() {
            res1();
          } );

          /*
          * This event is fired when the data source is drained no matter what was the data source.
          * It is not part of this library but rather from the NodeJS Stream API.
          * @see: https://nodejs.org/api/stream.html#stream_event_end
          */
          output.on( 'end', function() {
            console.log('end');
            res1();
          } );

          // good practice to catch warnings (ie stat failures and other non-blocking errors)
          archive.on( 'warning', function( err ) {
            if ( err.code === 'ENOENT' ) {
              // log warning
            }
            else {
              // throw error
              rej1( err );
            }
          } );

          // good practice to catch this error explicitly
          archive.on( 'error', function( err ) {
            rej1( err );
            // throw err;
          } );

          // pipe archive data to the file
          archive.pipe( output );

          archive.finalize();
        } );

    } )
    .then(() => {
      console.log('resolving with job zip path', jobZipPath);
      resolve({
        filePath: jobZipPath, 
        callback: (err) => {
          try{
            fs.remove(jobFolderPath)
          }catch(e) {
            console.error(e);
          }
        }
      })
    })
    .catch((err) => {
      console.log(err);
      fs.remove(jobFolderPath)
      reject(err);
    })
  });
}

module.exports = {
  bundleStoryAsSingleFile,
  bundleStoryAsMultipleFiles,
}