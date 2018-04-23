const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const adapter = new FileAsync('./data/storyList.json');

export const updateStoryList = (id) =>
  new Promise((resolve, reject) => {
    low(adapter)
    .then(db => {
      // db.get is sync
      const story = db.defaults({stories: []})
                    .get('stories')
                    .find({id})
                    .value();
      if (story) reject(new Error('story is exist'));
      else {
        db.get('stories')
          .push({id})
          .write()
          .then(() => resolve())
      }
    });
  });