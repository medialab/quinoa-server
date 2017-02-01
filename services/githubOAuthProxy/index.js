/**
 * This module retrieves an oauth code from github api oAuth process
 * @module services/githubOAuthProxy
 */

const https = require('https');

// integrates code from https://github.com/robindemourat/github-oauth-proxy/blob/master/server.js

let config;

if (process.env.NODE_ENV === 'production') {
  config = {
    github_client_id: process.env.GITHUB_CLIENT_ID,
    github_client_secret: process.env.GITHUB_CLIENT_SECRET,
    port: process.env.PORT || 3000
  };
  console.log('config is set from environment variables', config);
}
else { 
  config = require('../../config');
}

function getToken(code, res) {
    if (typeof code != 'string') {
        res.writeHead(400, 'Must supply code');
        res.end();
        return;
    }

    console.log('getting token');

    const ghreq = https.request({
        hostname: 'github.com',
        path: '/login/oauth/access_token',
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    }, function(ghres) {
        const data = '';

        if (ghres.statusCode === 404) {
            console.log('resource not found, returning a 404');
            res.writeHead(500);
            res.end();
            return;
        }

        ghres.on('data', function(chunk) { data += chunk; });
        ghres.on('end', function() {
            const body = JSON.parse(data);
            console.log('got final response');
            if (body['error'] != null)
                res.writeHead(400, body['error']);
            else
                res.writeHead(200);

            res.write(data);
            res.end();
        });
    });

    const data = {
        client_id: config.client_id || process.env.GITHUB_CLIENT_ID,
        client_secret: config.client_secret || process.env.GITHUB_CLIENT_SECRET,
        code: code
    };
    console.log('data', data);
    ghreq.write(JSON.stringify(data));
    ghreq.end();
}


module.exports = getToken;
