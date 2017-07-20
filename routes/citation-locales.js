const fs = require('fs');
const path = require('path');
const asyncMap = require('async').map;
const parseXMLString = require('xml2js').parseString;

const localesPath = path.resolve(__dirname + '/../resources/citationLocales');

let locales;

const localesRep = require(localesPath + '/locales.json');

fs.readdir(localesPath, (err, files) => {
  const cslFiles = files.filter(file => file.split('.').pop() === 'xml');
  asyncMap(cslFiles, (cslFile, cslCb) => {
    fs.readFile(localesPath + '/' + cslFile, 'utf-8', (fileErr, cslStr) => {
      if (fileErr) {
        cslCb(fileErr);
      } else {
        parseXMLString(cslStr, (xmlErr, xml) => {
          if (xmlErr) {
            cslCb(xmlErr);
          } else {
            const id = xml['locale']['$']['xml:lang'];
            const names = localesRep['language-names'][id];
            cslCb(null, {
              id,
              names,
              fileName: cslFile,
              data: cslStr,
              xmlJs: xml,
            });
          }
        });
      }
    })
  }, (err, results) => {
    if (!err) {
      locales = results;
    } else {
      console.error('error while loading locales');
      console.error(err);
    }
  });
});

module.exports = (req, res) => {
  // get one locale
  if (req.params.id) {
    const locale = locales.find(locale => locale.id === req.params.id);
    if (locale) {
      res.send(locale);
    } else {
      res.writeHead(404);
      res.write('could not find the requested locale');
      return res.end();
    }
  }
  // get all locales list
  else {
    const output = locales.map(locale => {
      return {
        id: locale.id,
        names: locale.names,
        title: locale.title
      }
    });
    res.send(output);
  }
};