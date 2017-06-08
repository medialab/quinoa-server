/**
 * This module proxies the index.html content of a given gist repository
 * @module routes/gist-presentation
 */
const app = require('../server');
const https = require('https');

const renderGistPresentation = (req, res) => {
  var ghreq = https.request({
        hostname: 'api.github.com',
        path: '/gists/' + req.params.id,
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "medialab"
        }
    }, function(ghres) {
        var data = '';

        if (ghres.statusCode === 404) {
            res.writeHead(500);
            res.end();
            return;
        }
        ghres.on('data', function(chunk) { data += chunk; });
        ghres.on('end', function() {
            const body = JSON.parse(data);
            const htmlUrl = body.files && body.files['index.html'] && body.files['index.html'].raw_url;
            if (htmlUrl) {
              return https.get(htmlUrl, indexRes => {
                var data = '';
                indexRes.on('data', d => {
                  data += d;
                });
                indexRes.on('end', () => {
                  res.writeHead(200);
                  res.write(data);
                  return res.end();
                })
                indexRes.on('error', e => {
                  res.writeHead(500);
                  res.write(e);
                  return res.end();
                })
              })
            } else {
              res.writeHead(422);
              res.write('could not find a index.html in the gist');
              return res.end();
            }
        });
    });
    ghreq.end();
}

app.get('/gist-presentation/:id', renderGistPresentation);
