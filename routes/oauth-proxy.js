const app = require('../server');

app.get('/oauth-proxy', (req, res) => {
  res.json('get oauth proxy');
})