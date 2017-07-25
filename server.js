/**
 * Quinoa-server
 * =============
 * entrypoint of the node-js application.
 * The app interfaces specific routes with the services provided by the app.
 * Routes are defined at the end of the file
 * @module quinoa-server
 */

const https = require('https');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

// internal dependencies
const basicAuth = require('./services/basic-auth-connect');
const citationLocales = require('./routes/citation-locales');
const citationStyles = require('./routes/citation-styles');
const oAuthProxy = require('./routes/oauth-proxy');
const gistStory = require('./routes/gist-story');
const gistPresentation = require('./routes/gist-presentation');
const renderPresentation = require('./routes/render-presentation');
const renderStory = require('./routes/render-story');
const presentationsRoutes = require('./routes/presentations');
const storiesRoutes = require('./routes/stories');
const renderDashboard = require('./routes/dashboard');

let config;
// in production mode config variables must be set as environment variables
if (process.env.NODE_ENV === 'production') {
  config = {
    github_client_id: process.env.GITHUB_CLIENT_ID,
    github_client_secret: process.env.GITHUB_CLIENT_SECRET,
    port: process.env.PORT || 3000,
    adminUserName: process.env.ADMIN_USERNAME,
    adminPassword: process.env.ADMIN_PASSWORD
  };
}
// in development mode config variables are retrieved from a json file
else { 
  config = require('./config');
}

const app = express();

// parse application/json
app.use(bodyParser.json({limit: '20mb'}));
app.use(bodyParser.urlencoded({limit: '20mb', extended: true}));

// allow cross-origin requests
app.use(cors());

module.exports = app;

// routes binding
app.get('/presentations/:id?', presentationsRoutes.getPresentations);
app.post('/presentations/:id', presentationsRoutes.updatePresentation);
app.put('/presentations/:id', presentationsRoutes.createPresentation);
app.delete('/presentations/:id', presentationsRoutes.deletePresentation);

app.get('/stories/:id?', storiesRoutes.getStories);
app.post('/stories/:id', storiesRoutes.updateStory);
app.put('/stories/:id', storiesRoutes.createStory);
app.delete('/stories/:id', storiesRoutes.deleteStory);

app.post('/render-presentation', renderPresentation);
app.post('/render-story', renderStory);

// we use a simple auth middleware for the admin view access
const auth = basicAuth(config.adminUserName, config.adminPassword);
app.get('/dashboard', auth, renderDashboard);
// proxy used in the github oauth authentication process
app.post('/oauth-proxy/:appName', cors(),  oAuthProxy);

app.get('/gist-story/:id', gistStory);
app.get('/gist-presentation/:id', gistPresentation);

app.get('/citation-locales/:id?', citationLocales);
app.get('/citation-styles/:id?', citationStyles);

/**
 * listening to requests (defaults to 3000)
 */
app.listen(config.port, function(){
  console.log('app listening on %s', config.port);
});