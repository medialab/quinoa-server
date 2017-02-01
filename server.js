const http = require('http');
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

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb'}));

// allow cross-origin requests
app.use(cors());

module.exports = app;

require('./routes/presentations');
require('./routes/render-presentation');
require('./routes/oauth-proxy');

app.listen(config.port, function(){
  console.log('app listening on %s', config.port);
});