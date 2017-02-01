const app = require('../server');

const getToke = require('../services/githubOAuthProxy');

app.post('/oauth-proxy/', (req, res) => {
  const code = req.body && req.body.code;
  console.log('asked with code', code);
  return getToken(code, res);
});