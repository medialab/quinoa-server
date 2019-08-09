import manager from './services/stories';
import path from 'path';
import fs from 'fs-extra';

const tutorialsFolder = path.resolve(`${__dirname}/../resources/tutorials`);
let tutorialFr = JSON.parse(fs.readFileSync(`${tutorialsFolder}/tutorial-fr.json`, 'utf8').trim());
let tutorialEn = JSON.parse(fs.readFileSync(`${tutorialsFolder}/tutorial-en.json`, 'utf8').trim());

console.log('creating tutorials as first stories')
Promise.resolve()
    .then(() => manager.createStory(tutorialFr, 'tutoriel'))
    .then(() => manager.createStory(tutorialEn, 'tutorial'))
    .then(() => {
        console.log('done creating tutorials');
        process.exit()
    })
