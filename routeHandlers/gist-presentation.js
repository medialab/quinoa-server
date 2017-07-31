/**
 * This module proxies the index.html content of a given gist repository
 * ==========
 * @module quinoa-server/routes/gist-presentation
 */
const https = require('https');

/**
 * Resolves a gist presentation rendering request
 * @param {obj} req - the request object
 * @param {obj} res- the resource object
 */
const renderGistPresentation = (req, res) => {
  // we setup a request to get the gists' data
  // we will then consume obtained data to produce a view
  // of this data as a html webpage
  const ghreq = https.request({
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
        // case: all data is there and nothing bad happened
        ghres.on('end', function() {
            let body;
            try{
              body = JSON.parse(data);
              // case bad formatted answer from gist
            } catch (e) {
              // todo: find the proper error code for this case
              res.writeHead(407);
              return res.send(e);
            }
            // get the main index.html url
            const htmlUrl = body.files && body.files['index.html'] && body.files['index.html'].raw_url;
            if (htmlUrl) {
              // retrieve the main index.html url
              return https.get(htmlUrl, indexRes => {
                var data = '';
                indexRes.on('data', d => {
                  data += d;
                });
                indexRes.on('end', () => {
                  res.writeHead(200);
                  // return data of the index as is
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
              res.writeHead(422);// unprocessable entity error
              res.write('could not find a index.html in the gist');
              return res.end();
            }
        });
    });
    ghreq.end();
}

module.exports = renderGistPresentation;

