import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const salt = 8;
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const adapter = new FileAsync('./data/db.json');

const hash = (password) => bcrypt.hash(password, salt);
const comparePassword = (password, hash) => bcrypt.compare(password, hash);

let config;
if (process.env.NODE_ENV === 'production') {
  config = {
    secret: process.env.SECRET
  };
}
else {
  config = require('../../config');
}

const buildToken = (id, secret, expiresIn = 86400) => {
  const payload = {
    id
  }
  const token = jwt.sign(payload, secret, {
    expiresIn
  });
  return token;
};

const register = (id, password) =>
  new Promise((resolve, reject) => {
    low(adapter)
    .then(db => {
      // db.get is sync
      const story = db.defaults({credentials: []})
                    .get('credentials')
                    .find({id})
                    .value();
      if (story) reject(new Error('story is exist'));
      else {
        hash(password, salt)
        .then(hashedPassword => {
          db.get('credentials')
          .push({id, password: hashedPassword})
          .write()
        })
        .then(() => {
          // create a token
          const token = buildToken(id, config.secret);
          resolve(token);
        })
        .catch(err => {
          reject(err);
        })
      }
    });
  });

const login = (id, password) =>
  new Promise((resolve, reject) => {
    low(adapter)
    .then(db => {
      // db.get is sync
      const story = db.defaults({credentials: []})
                    .get('credentials')
                    .find({id})
                    .value();

      if (!story) reject(new Error('story not found'));
      else {
        if (password === config.adminPassword) {
          const token = buildToken(id, config.secret);
          resolve(token);
        }
        else {
          comparePassword(password, story.password)
          .then(match => {
            if (match) {
              const token = buildToken(id, config.secret);
              resolve(token)
            } else {
              reject(new Error('wrong password, authentication failed'));
            }
          })
          .catch(err => {
            reject(new Error('login failed'));
          });
        }
      }
    });
  });

const resetPassword = (id, oldPassword, newPassword) =>
  new Promise((resolve, reject) => {
    low(adapter)
    .then(db => {
      // db.get is sync
      const story = db.defaults({credentials: []})
                    .get('credentials')
                    .find({id})
                    .value();
      if (!story) reject(new Error('story not found'));
      else {
        if (oldPassword === config.adminPassword) {
          hash(newPassword)
          .then(hashedPassword => {
            db.get('credentials')
            .find({id})
            .assign({password: hashedPassword})
            .write()
          })
          .then(() => {
            // create a token
            const token = buildToken(id, config.secret);
            resolve(token);
          })
          .catch((err) => reject(err));
        }
        else {
          comparePassword(oldPassword, story.password)
          .then(match => {
            if (match) {
              hash(newPassword)
              .then(hashedPassword => {
                db.get('credentials')
                .find({id})
                .assign({password: hashedPassword})
                .write()
              })
              .then(() => {
                // create a token
                const token = buildToken(id, config.secret);
                resolve(token);
              })
              .catch((err) => {
                reject(err);
              });
            } else {
              reject(new Error('wrong password, authentication failed'));
            }
          })
          .catch(err => reject(err));
        }
      }
    });
  })

module.exports = {
  register,
  login,
  resetPassword
}