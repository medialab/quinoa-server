const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const adapter = new FileAsync('./data/db.json');

/**
 * Configure JWT and bcrypt
 */
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const bcrypt = require('bcrypt');
const salt = 8;
const hash = (password) => bcrypt.hash(password, salt);
const comparePassword = (password, hash) => bcrypt.compare(password, hash);

// const config = require('../../config'); // get config file
let config;
if (process.env.NODE_ENV === 'production') {
  config = {
    secret: process.env.SECRET
  };
}
else {
  config = require('../../config');
}

function createCredential(id, password, callback) {

  low(adapter)
  .then(db => {
    // db.get is sync
    const story = db.defaults({credentials: []})
                  .get('credentials')
                  .find({id})
                  .value();
    if (story) {
      callback('story is exist');
    }
    else {
      hash(password)
      .then(hashedPassword => {
        db.get('credentials')
        .push({id, password: hashedPassword})
        .write()
      })
      .then(() => {
        // create a token
        const token = jwt.sign({id}, config.secret, {
          expiresIn: 86400 // expires in 24 hours
        });
        callback(null, token);
      })
      .catch((err) => {
        callback(err);
      });
    }
  });
}
function updateCredential (id, password, callback) {
  low(adapter)
  .then(db => {
    // db.get is sync
    const story = db.defaults({credentials: []})
                  .get('credentials')
                  .find({id})
                  .value();
    if (!story) {
      callback('story credential not found');
    }
    else {
      hash(password)
      .then(hashedPassword => {
        db.get('credentials')
        .push({id, password: hashedPassword})
        .write()
      })
      .then(() => {
        // create a token
        const token = jwt.sign({id}, config.secret, {
          expiresIn: 86400 // expires in 24 hours
        });
        callback(null, token);
      })
      .catch((err) => {
        callback(err);
      });
    }
  });
}
function deleteCredential(id, callback) {
  low(adapter)
  .then(db => {
    db.defaults({credentials: []})
      .get('credentials')
      .remove({id})
      .write()
      .then(() => {
        callback(null, id);
      })
      .catch(err => callback(err));
  });
}

function login(id, password, callback) {
  low(adapter)
  .then(db => {
    // db.get is sync
    const story = db.defaults({credentials: []})
                  .get('credentials')
                  .find({id})
                  .value();

    if (!story) callback('story id not found');
    else {
      comparePassword(password, story.password)
      .then(match => {
        if (match) {
          const token = jwt.sign({id}, config.secret, {
            expiresIn: 86400 // expires in 24 hours
          });
          callback(null, token);
        } else {
          callback('wrong password, authentication failed');
        }
      })
      .catch(err=> {
        callback(err);
      });
    }
  });
}

/**
 * The module exports a map of crud functions
 */
module.exports = {
  createCredential,
  updateCredential,
  deleteCredential,
  login
};
