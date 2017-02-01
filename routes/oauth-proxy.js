const cors = require('cors');

const app = require('../server');

const getToken = require('../services/githubOAuthProxy');

app.post('/oauth-proxy', cors(), (req, res) => {

  console.log('got request');
  res.setHeader('Allow', 'POST');
  res.setHeader('Accept', 'application/json');
  const data = '';

  console.log('got request with method ', req.method);

  if (req.method !== 'POST') {
      res.writeHead(405);
      res.end();
      return;
  }

  console.log('request is a post as expected');

  const lcHeaders = {};
  for (k in req.headers)
      lcHeaders[k.toLowerCase()] = req.headers[k];

  if (lcHeaders['content-type'] !== 'application/json') {
      res.writeHead(415, 'Content-Type must be application/json');
      res.end();
      return;
  }

  if (!req.body.code) {
    res.writeHead(415, 'Request body must contain a code prop');
    res.end();
    return;
  }
  getToken(req.body.code, res);

  /*req.on('data', function(chunk) {
      data += chunk;
      if (data.length > 1e6) {
          // body too large
          res.writeHead(413);
          req.connection.destroy();
      }
  });
  req.on('end', function() {
      const body = data != '' ? JSON.parse(data) : undefined;
      console.log('got body,', body, ' getting token');
      getToken(body['code'], res);
  });*/
});