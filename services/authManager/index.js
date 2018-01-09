const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const adapter = new FileAsync('./data/db.json');

/**
 * Configure JWT
 */
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const bcrypt = require('bcryptjs');
const config = require('../../config'); // get config file

function createCredential(id, password, callback) {
  const hashedPassword = bcrypt.hashSync(password, 8);

  low(adapter)
  .then(db => {
    // db.get is sync
    const story = db.defaults({credentials: []})
                  .get('credentials')
                  .find({id})
                  .value();
    if (story) {
      callback({error: 'story is exist'}, null);
    }
    else {
      db.get('credentials')
      .push({id, password: hashedPassword})
      .write()
      .then(() => {
        // create a token
        const token = jwt.sign({id}, config.secret, {
          expiresIn: 86400 // expires in 24 hours
        });
        callback(null, token);
      })
      .catch((err) => {
        callback(err, null);
      });
    }
  });
}
function updateCredential (id, password, callback) {
  low(adapter)
  .then(db => {
    const hashedPassword = bcrypt.hashSync(password, 8);
    // db.get is sync

    const story = db.defaults({credentials: []})
                  .get('credentials')
                  .find({id})
                  .value();
    if (!story) {
      callback({error: 'story credential not found'}, null);
    }
    else {
      db.get('credentials')
      .find({id})
      .assign({password: hashedPassword})
      .write()
      .then(() => {
        // create a token
        const token = jwt.sign({id}, config.secret, {
          expiresIn: 86400 // expires in 24 hours
        });
        callback(null, token);
      })
      .catch((err) => {
        callback(err, null);
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
      });
  });
}

function login(id, password, res) {
  low(adapter)
  .then(db => {
    // db.get is sync
    const story = db.defaults({credentials: []})
                  .get('credentials')
                  .find({id})
                  .value();

    if (!story) return res.status(404).send('Story id not found');
    const passwordIsValid = bcrypt.compareSync(password, story.password);
    if (!passwordIsValid) return res.status(401).send({auth: false, token: null});
    const token = jwt.sign({id}, config.secret, {
      expiresIn: 86400 // expires in 24 hours
    });
    return res.status(200).send({auth: true, token});
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
