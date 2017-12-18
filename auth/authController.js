const express = require('express');
const router = express.Router();
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')

const verifyToken = require('./verifyToken');

const adapter = new FileAsync('./data/db.json')

/**
 * Configure JWT
 */
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const bcrypt = require('bcryptjs');
const config = require('../config'); // get config file

// Create database instance and start server
low(adapter)
  .then(db => {
    router.post('/register', function(req, res) {
      req.checkBody('password', 'Password must have at least 6 characters').isLength({min: 6});

      const errors = req.validationErrors();
      // if there are errors, display signup page
      if (errors) {
        return res.status(422).send(errors);
      }

      const hashedPassword = bcrypt.hashSync(req.body.password, 8);
      const story = db.get('credentials')
                      .find({ id: req.body.id })
                      .value()
      if (!story) {
        db.get('credentials')
        .push({
          id: req.body.id,
          password: hashedPassword
        })
        .write()
        .then(() => {
          // create a token
          const token = jwt.sign({ id: req.body.id }, config.secret, {
            expiresIn: 86400 // expires in 24 hours
          });
          res.status(200).send({ auth: true, token: token });
        })
      }
      else {
        db.get('credentials')
        .find({id: req.body.id})
        .assign({ password: hashedPassword })
        .write()
        .then(() => {
          // create a token
          const token = jwt.sign({ id: req.body.id }, config.secret, {
            expiresIn: 86400 // expires in 24 hours
          });
          res.status(200).send({ auth: true, token: token });
        })
      }
    });

    router.post('/login', function(req, res) {
      const story = db.get('credentials')
                      .find({ id: req.body.id })
                      .value()

      if (!story) return res.status(404).send('Story id not found');
      const passwordIsValid = bcrypt.compareSync(req.body.password, story.password);
      if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
      const token = jwt.sign({ id: story.id }, config.secret, {
        expiresIn: 86400 // expires in 24 hours
      });
      // return the information including token as JSON
      res.status(200).send({ auth: true, token: token });
    });
    // Set db default values
    return db.defaults({ credentials: [] }).write()
  })

module.exports = router;