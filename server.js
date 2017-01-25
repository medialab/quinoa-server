const http = require('http');
const https = require('https');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

const config = require('./config');

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

app.listen(config.port, function(){
  console.log('app listening on %s', config.port);
});