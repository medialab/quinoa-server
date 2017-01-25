const app = require('../server');

const getToke = require('../services/githubOAuthProxy');

app.get('/oauth-proxy/:code', (req, res) => {
  const code = req.params.code;
  return getToken(code, res);
});