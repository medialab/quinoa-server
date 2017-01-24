const app = require('../server');


app.get('/presentations/:id?', (req, res) => {
  if (req.params.id) {
    req.json('get presentation ' + id);
  }
  else {
    res.json('get all presentations');
  }
})