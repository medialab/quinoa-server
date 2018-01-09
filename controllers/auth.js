const router = require('express').Router();

const manager = require('../services/authManager');
const verifyToken = require('./verifyToken');

router.post('/credential', function(req, res) {
  req.checkBody('password', 'Password must have at least 6 characters').isLength({min: 6});

  const errors = req.validationErrors();
  if (errors) {
    return res.status(422).send(errors);
  }
  manager.createCredential(req.body.id, req.body.password, (err, token) => {
    if (err) {
      return res.status(500).send(err);
    } else res.status(200).send({auth: true, token});
  });
});

router.put('/credential/:id', verifyToken, function(req, res) {
  req.checkBody('password', 'Password must have at least 6 characters').isLength({min: 6});

  const errors = req.validationErrors();
  if (errors) {
    return res.status(422).send(errors);
  }
  manager.updateCredential(req.body.id, req.body.password, (err, token) => {
    if (err) {
      return res.status(500).send(err);
    } else res.status(200).send({auth: true, token});
  });
});

router.post('/login', function(req, res) {
  manager.login(req.body.id, req.body.password, res);
});

router.delete('/credential/:id', verifyToken, function(req, res) {
  manager.deleteCredential(req.params.id, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else res.status(200).send({auth: false});
  });
});
module.exports = router;
