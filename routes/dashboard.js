/**
 * This module serves a dashboard interface to locally stored documents
 * @module routes/dashboard
 */

const presentationsManager = require('../services/presentationsManager');
const storiesManager = require('../services/storiesManager');


const style = `
body{
  font-family: 'Open Sans', sans-serif;
  margin: 1rem 10% 3rem 10%;
}
ul{
  padding: 0;
}

li.presentation-item,
li.story-item
{
  list-style-type: none;
  padding: 1rem;
  margin: 0 0 1rem 0;
  border: 1px solid black;
}
li.presentation-item .informations,
li.story-item .informations
{
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid black;
}
li.presentation-item h3{
  margin : 0;
}
.links-container,
.operations-container{
  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid black;
}
.links-container a,
.operations-container button{
  flex: 1;
  text-decoration: none;
  padding: .5rem;
  transition: all .5s ease;
  cursor: pointer;
  outline: none;
  border-radius: none;
  text-align : center;
  font-size : .7rem;
  border: none;
}
.links-container a:not(:last-of-type) ,
.operations-container button:not(:last-of-type) 
{
  margin-right: .5rem;
}
.links-container a{
  background: lightgreen;
}
.operations-container button{
  background: lightblue;
}
.links-container a:hover
{
  background: green;
  color: white;
}
.operations-container button:hover
{
  background: darkblue;
  color: white;
}
.operations-container button.dangerous-btn:hover
{
  background: red;
}
`;

const buildEmbedCode = (document, baseUrl, type) => 
  `<iframe 
  allowfullscreen
  src="${baseUrl}/${type}/${document.id}?format=html"
  width="1000"
  height="500"
  frameborder=0
></iframe>`;

const renderPresentationItem = (presentation, baseUrl) => 
  `
  <li class="presentation-item" id="presentation-${presentation.id}">
    <div class="informations">
      <h3>${presentation.metadata.title}</h3>
      <p>
        ${presentation.metadata.authors.join(', ')}
      </p>
      <p>
        ${presentation.metadata.description}
      </p>
    </div>
    <div class="links-container">
      <a href="/presentations/${presentation.id}" target="blank">Open presentation as JSON</a>
      <a href="/presentations/${presentation.id}?format=html" target="blank">Open presentation as a html page</a>
    </div>
    <div class="operations-container">
      <button class="embed-btn">Copy embed code</button>
      <button class="dangerous-btn">Delete presentation</button>
    </div>
    <div class="embed-placeholder">${buildEmbedCode(presentation, baseUrl, 'presentations')}</div>
  </li>
`;

const renderStoryItem = (story, baseUrl) => 
  `
  <li class="story-item" id="story-${story.id}">
    <div class="informations">
      <h3>${story.metadata.title}</h3>
      <p>
        ${story.metadata.authors.join(', ')}
      </p>
      <p>
        ${story.metadata.description}
      </p>
    </div>
    <div class="links-container">
      <a href="/stories/${story.id}" target="blank">Open story as JSON</a>
      <a href="/stories/${story.id}?format=html" target="blank">Open story as a html page</a>
    </div>
    <div class="operations-container">
      <button class="embed-btn">Copy embed code</button>
      <button class="dangerous-btn">Delete story</button>
    </div>
    <div class="embed-placeholder">${buildEmbedCode(story, baseUrl, 'stories')}</div>
  </li>
`;

const renderDashboard = (req, res) => {
  const baseUrl = /*req.protocol +*/ 'https://' + req.get('host');
  return presentationsManager.getPresentations(null, (err1, presentations) => {
    if (err1) {
      return res.status(500).send(err1);
    } else {
      return storiesManager.getStories(null, (err2, stories) => {
        if (err2) {
          return res.status(500).send(err2);
        }
        const presentationsList = Object.keys(presentations)
          .map(key => presentations[key])
          .map(p => renderPresentationItem(p, baseUrl))
          .join('\n');
        const storiesList = Object.keys(stories)
          .map(key => stories[key])
          .map(p => renderStoryItem(p, baseUrl))
          .join('\n');
        const html =  `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Quinoa server | dashboard</title>
        <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">
        <style>${style}</style>
      </head>
      <body>
        <h1>Quinoa dashboard</h1>
        <h2>Stories</h2>
        <ul class="stories-list">
          ${storiesList}
        </ul>
        <h2>Presentations</h2>
        <ul class="presentations-list">
          ${presentationsList}
        </ul>
        <script>
          /**
           * DOM element remove shim
           */
           (function () {
              var typesToPatch = ['DocumentType', 'Element', 'CharacterData'],
                  remove = function () {
                      // The check here seems pointless, since we're not adding this
                      // method to the prototypes of any any elements that CAN be the
                      // root of the DOM. However, it's required by spec (see point 1 of
                      // https://dom.spec.whatwg.org/#dom-childnode-remove) and would
                      // theoretically make a difference if somebody .apply()ed this
                      // method to the DOM's root node, so let's roll with it.
                      if (this.parentNode != null) {
                          this.parentNode.removeChild(this);
                      }
                  };

              for (var i=0; i<typesToPatch.length; i++) {
                  var type = typesToPatch[i];
                  if (window[type] && !window[type].prototype.remove) {
                      window[type].prototype.remove = remove;
                  }
              }
          })();
          /**
           * Copy text to clipboard util
           */
          function copyTextToClipboard(text) {
              var textArea = document.createElement("textarea");

              //
              // *** This styling is an extra step which is likely not required. ***
              //
              // Why is it here? To ensure:
              // 1. the element is able to have focus and selection.
              // 2. if element was to flash render it has minimal visual impact.
              // 3. less flakyness with selection and copying which **might** occur if
              //    the textarea element is not visible.
              //
              // The likelihood is the element won't even render, not even a flash,
              // so some of these are just precautions. However in IE the element
              // is visible whilst the popup box asking the user for permission for
              // the web page to copy to the clipboard.
              //

              // Place in top-left corner of screen regardless of scroll position.
              textArea.style.position = 'fixed';
              textArea.style.top = 0;
              textArea.style.left = 0;

              // Ensure it has a small width and height. Setting to 1px / 1em
              // doesn't work as this gives a negative w/h on some browsers.
              textArea.style.width = '2em';
              textArea.style.height = '2em';

              // We don't need padding, reducing the size if it does flash render.
              textArea.style.padding = 0;

              // Clean up any borders.
              textArea.style.border = 'none';
              textArea.style.outline = 'none';
              textArea.style.boxShadow = 'none';

              // Avoid flash of white box if rendered for any reason.
              textArea.style.background = 'transparent';


              textArea.value = text;

              document.body.appendChild(textArea);

              textArea.select();

              try {
                var successful = document.execCommand('copy');
                var msg = successful ? 'successful' : 'unsuccessful';
                console.log('Copying text command was ' + msg);
              } catch (err) {
                console.log('Oops, unable to copy');
              }

              document.body.removeChild(textArea);
            }

          var presentationCartels= document.querySelectorAll('.presentation-item');
          for (i = 0; i < presentationCartels.length ; i ++) {
            var item = presentationCartels[i];
            var id = item.getAttribute('id');
            var embedBtn = document.querySelector('#' + id + ' .embed-btn');
            var deleteBtn = document.querySelector('#' + id + ' .dangerous-btn');
            var html = document.querySelector('#' + id + ' .embed-placeholder').innerHTML;
            embedBtn.addEventListener('click', function(event) {
              copyTextToClipboard(html);
              alert('★★★★★ The html code of your presentation embed kit has been copied to your clipboard ! Paste it inside any html code you want to embed your presentation into. ★★★★★');
            });
            deleteBtn.addEventListener('click', function(event) {
              var finalId = id.split('presentation-')[1];
              console.log('launch delete request for ', finalId);
              var http = new XMLHttpRequest();
              var url = "/presentations/" + finalId;
              http.open("DELETE", url);
              http.onreadystatechange = function() {//Call a function when the state changes.
                if(http.readyState == 4 && http.status == 200) {
                  // console.log('response', http.responseText);
                  item.remove();
                }
              }
              http.send();
            });

          }
        </script>
      </body>
      </html>
      `;
        return res.send(html);
      });
    }
  });
};

module.exports = renderDashboard;


