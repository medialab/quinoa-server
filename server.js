const https = require('https');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

let config;

if (process.env.NODE_ENV === 'production') {
  config = {
    github_client_id: process.env.GITHUB_CLIENT_ID,
    github_client_secret: process.env.GITHUB_CLIENT_SECRET,
    port: process.env.PORT || 3000,
    adminUserName: process.env.ADMIN_USERNAME,
    adminPassword: process.env.ADMIN_PASSWORD
  };
}
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

// routes binding
app.get('/presentations/:id?', presentationsRoutes.getPresentations);
app.patch('/presentations/:id', presentationsRoutes.updatePresentation);
app.put('/presentations/:id', presentationsRoutes.createPresentation);
app.delete('/presentations/:id', presentationsRoutes.deletePresentation);

app.get('/stories/:id?', storiesRoutes.getStories);
app.patch('/stories/:id', storiesRoutes.updateStory);
app.put('/stories/:id', storiesRoutes.createStory);
app.delete('/stories/:id', storiesRoutes.deleteStory);

app.post('/render-presentation', renderPresentation);
app.post('/render-story', renderStory);

const auth = basicAuth(config.adminUserName, config.adminPassword);
app.get('/dashboard', auth, renderDashboard);

app.post('/oauth-proxy/:appName', cors(),  oAuthProxy);

app.get('/gist-story/:id', gistStory);
app.get('/gist-presentation/:id', gistPresentation);

app.get('/citation-locales/:id?', citationLocales);
app.get('/citation-styles/:id?', citationStyles);

app.listen(config.port, function(){
  console.log('app listening on %s', config.port);
});