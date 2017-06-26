const app = require('../server');
const fs = require('fs');
const path = require('path');
const asyncMap = require('async').map;
const parseXMLString = require('xml2js').parseString;

const stylesPath = path.resolve(__dirname + '/../resources/citationStyles');

let styles;

fs.readdir(stylesPath, (err, files) => {
  const cslFiles = files.filter(file => file.split('.').pop() === 'csl');
  asyncMap(cslFiles, (cslFile, cslCb) => {
    fs.readFile(stylesPath + '/' + cslFile, 'utf-8', (fileErr, cslStr) => {
      if (fileErr) {
        cslCb(fileErr);
      } else {
        parseXMLString(cslStr, (xmlErr, xml) => {
          if (xmlErr) {
            cslCb(xmlErr);
          } else {
            const metadata = xml.style.info[0];
            const title = metadata.title[0];
            const idUrl = metadata.id[0];
            const id = cslFile.split('.').slice(0, cslFile.split('.').length - 1).join('.');
            cslCb(null, {
              title,
              idUrl,
              id,
              fileName: cslFile,
              string: cslStr,
              xmlJs: xml
            });
          }
        });
      }
    })
  }, (err, results) => {
    if (!err) {
      styles = results;
    } else {
      console.error('error while loading styles');
      console.error(err);
    }
  });
});

app.get('/citation-styles/:id?', (req, res) => {
  // get one style
  if (req.params.id) {
    const style = styles.find(style => style.id === req.params.id);
    if (style) {
      res.send(style);
    } else {
      res.writeHead(404);
      res.write('could not find the requested style');
      return res.end();
    }
  }
  // get all styles list
  else {
    const output = styles.map(style => {
      return {
        id: style.id,
        title: style.title
      }
    });
    res.send(output);
  }
});