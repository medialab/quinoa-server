const http = require('http');
const https = require('https');

const cors = require('cors');
const express = require('express')
const app = express();

const config = require('./config');

app.use(cors());

module.exports = app;

require('./routes/presentations');

app.listen(3001, function(){
  console.log('app listening on 3001');
});