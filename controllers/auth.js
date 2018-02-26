const router = require('express').Router();

const manager = require('../services/authManager');
const verifyToken = require('./verifyToken');

router.post('/credential', function(req, res) {
  req.checkBody('password', 'Password must have at least 6 characters').isLength({min: 6});

  const errors = req.validationErrors();
  if (errors) {
    return res.status(422).send({message: 'invalid password'});
  }
  manager.createCredential(req.body.id, req.body.password, (err, token) => {
    if (err) {
      return res.status(500).send(err);
    } else res.status(200).send({auth: true, token});
  });
});

router.put('/credential/:id', function(req, res) {
  req.checkBody('newPassword', 'Password must have at least 6 characters').isLength({min: 6});

  const errors = req.validationErrors();
  if (errors) {
    return res.status(422).send({message: 'invalid password'});
  }
  manager.updateCredential(req.body.id, req.body.oldPassword, req.body.newPassword, (err, token) => {
    if (err) {
      return res.status(500).send(err);
    } else res.status(200).send({auth: true, token});
  });
});

router.post('/login', function(req, res) {
  manager.login(req.body.id, req.body.password, (err, token) => {
    if (err) {
      return res.status(500).send({auth: false, message: err});
    } else res.status(200).send({auth: true, token})
  });
});

router.delete('/credential/:id', verifyToken, function(req, res) {
  manager.deleteCredential(req.params.id, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else res.status(200).send({id: req.params.id});
  });
});
module.exports = router;
