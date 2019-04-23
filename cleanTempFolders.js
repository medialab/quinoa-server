/**
 * This scripts cleans the temp dir
 * It verifies that it is not deleting an working folder by checking if the last modification date is superior to one hour
 */

const tempFolder = __dirname + '/temp';
const fs = require('fs-extra');

const HOUR = 1000 * 3600;
const now = new Date().getTime();


module.exports = function() {
    console.log('cleaning the temp folder %s', tempFolder);
    fs.readdir(tempFolder)
    .then(items => {
        items.reduce( ( cur, item ) => {
            return cur.then(() => new Promise( ( resolve, reject ) => {
                const itemPath = `${tempFolder}/${item}`;
                fs.lstat(itemPath)
                .then(stats => {
                    const lastModified = stats.mtimeMs;
                    if (now - lastModified > HOUR) {
                        console.log('removing %s', itemPath)
                        fs.remove(itemPath)
                        .then(resolve)
                        .catch(reject)
                    } else {
                        console.log('not removing %s', itemPath)
                        resolve();
                    }
                })
                .catch(reject); 
            }));
        }, Promise.resolve())
        .then(() => console.log('all cleaning done'))
        .catch(console.error)
    });

}

