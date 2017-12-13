const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const verifyToken = require('./verifyToken');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
const Story = require('../story/Story');

/**
 * Configure JWT
 */
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const bcrypt = require('bcryptjs');
const config = require('../config'); // get config file

router.post('/login', function(req, res) {
  Story.findOne({ storyId: req.body.id }, function (err, story) {
    if (err) return res.status(500).send('Error on the server.');
    if (!story) return res.status(404).send('No story found.');

    // check if the password is valid
    const passwordIsValid = bcrypt.compareSync(req.body.password, story.password);
    if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });

    // if story is found and password is valid
    // create a token
    const token = jwt.sign({ id: story._id }, config.secret, {
      expiresIn: 86400 // expires in 24 hours
    });

    // return the information including token as JSON
    res.status(200).send({ auth: true, token: token });
  });

});

router.get('/logout', function(req, res) {
  res.status(200).send({ auth: false, token: null });
});

router.post('/register', function(req, res) {

  const hashedPassword = bcrypt.hashSync(req.body.password, 8);
  Story.findOne({ storyId: req.body.id }, function (err, story) {
    if (err) return res.status(500).send('Error on the server.');
    if (!story) {
      Story.create({
        storyId : req.body.id,
        password : hashedPassword
      },
      function (err, story) {
        if (err) return res.status(500).send("There was a problem registering the story.");

        // if story is registered without errors
        // create a token
        const token = jwt.sign({ id: story._id }, config.secret, {
          expiresIn: 86400 // expires in 24 hours
        });

        res.status(200).send({ auth: true, token: token });
      });
    }
    if (story) {
      Story.update({
        password : hashedPassword
      },
      function (err, story) {
        if (err) return res.status(500).send("There was a problem registering the story.");

        // if story is registered without errors
        // create a token
        const token = jwt.sign({ id: story._id }, config.secret, {
          expiresIn: 86400 // expires in 24 hours
        });
        res.status(200).send({ auth: true, token: token });
      });
    }
  })

});

// router.get('/me', verifyToken);
router.get('/me', verifyToken, function(req, res, next) {

  Story.findById(req.decodeId, { password: 0 }, function (err, story) {
    if (err) return res.status(500).send("There was a problem finding the story.");
    if (!story) return res.status(404).send("No story found.");
    res.status(200).send(story);
  });
});

module.exports = router;