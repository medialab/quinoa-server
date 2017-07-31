/**
 * This module provides a proxy in the github's oauth authentication process
 * started in front-end applications
 * For more information about the oauth process for github see:
 * https://developer.github.com/apps/building-integrations/setting-up-and-registering-oauth-apps/about-authorization-options-for-oauth-apps/
 * ==========
 * @module quinoa-server/routes/oauth-proxy
 */

// this point interfaces strongly with the githubOAuthProxy service
// (see it for a better understanding of the process)
const getToken = require('../services/githubOAuthProxy');

/**
 * Resolves an oauth token request
 * @param {obj} req - the request object
 * @param {obj} res- the resource object
 */
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