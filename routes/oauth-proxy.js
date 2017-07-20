
const getToken = require('../services/githubOAuthProxy');

module.exports = (req, res) => {
  res.setHeader('Allow', 'POST');
  res.setHeader('Accept', 'application/json');
  const data = '';
  const appName = req.params.appName;

  if (req.method !== 'POST') {
      res.writeHead(405);
      res.end();
      return;
  }

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
  getToken(appName, req.body.code, res);
};