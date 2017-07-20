const https = require('https');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

let config;

if (process.env.NODE_ENV === 'production') {
  config = {
    github_client_id: process.env.GITHUB_CLIENT_ID,
    github_client_secret: process.env.GITHUB_CLIENT_SECRET,
    port: process.env.PORT || 3000
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

require('./routes/presentations');
require('./routes/stories');
require('./routes/render-presentation');
require('./routes/render-story');
require('./routes/oauth-proxy');
require('./routes/dashboard');
require('./routes/gist-presentation');
require('./routes/gist-story');
require('./routes/citation-locales');
require('./routes/citation-styles');

app.listen(config.port, function(){
  console.log('app listening on %s', config.port);
});