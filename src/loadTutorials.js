import manager from './services/stories';
import path from 'path';
import fs from 'fs-extra';
import config from 'config';

const tutorialsFolder = path.resolve(`${__dirname}/../resources/tutorials`);
let tutorialFr = JSON.parse(fs.readFileSync(`${tutorialsFolder}/tutorial-fr.json`, 'utf8').trim());
let tutorialEn = JSON.parse(fs.readFileSync(`${tutorialsFolder}/tutorial-en.json`, 'utf8').trim());
let exampleStory = JSON.parse(fs.readFileSync(`${tutorialsFolder}/naturpradi-example.json`, 'utf8').trim());
tutorialFr = Object.assign(
  tutorialFr, 
  {
    metadata: Object.assign(
      tutorialFr.metadata, 
      {
        isSpecial: true, 
        specificLanguage: 'fr'
      }
    )
  }
)
tutorialEn = Object.assign(
  tutorialEn, 
  {
    metadata: Object.assign(
      tutorialEn.metadata, 
      {
        isSpecial: true, 
        specificLanguage: 'en'
      }
    )
  }
)
exampleStory = Object.assign(
  exampleStory, 
  {
    metadata: Object.assign(
      exampleStory.metadata, 
      {
        isSpecial: true
      }
    )
  }
)
const getOrCreateStory = (data, password, id, jobName) => {
  return new Promise((resolve, reject) => {
    console.log('attempting to get', jobName);
    manager.getStory(id)
      .then(() => {
        console.log(jobName, 'already exists')
        resolve()
      })
      .catch(() => {
        console.log('have to create', id);
        manager.createStory(data, password, id)
        .then(resolve)
        .catch(reject)
      })
  })
}

console.log('creating tutorials as first stories')
Promise.resolve()
  .then(() => getOrCreateStory(tutorialFr, 'tutoriel', tutorialFr.id, 'tutoriel fr'))
  .then(() => getOrCreateStory(tutorialEn, 'tutorial', tutorialEn.id, 'tutoriel en'))
  .then(() => getOrCreateStory(exampleStory, 'Exemple de récit / Example story', exampleStory.id, 'example story'))
  .then(() => {
      console.log('done creating tutorials');
      process.exit()
  })
