/**
 * This module retrieves an oauth code from github api oAuth process
 * @module services/githubOAuthProxy
 */


// integrate https://github.com/robindemourat/github-oauth-proxy/blob/master/server.js

const config = require('../../config');

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
            res.writeHead(500);
            res.end();
            return;
        }

        ghres.on('data', function(chunk) { data += chunk; });
        ghres.on('end', function() {
            const body = JSON.parse(data);
            if (body['error'] != null)
                res.writeHead(400, body['error']);
            else
                res.writeHead(200);

            res.write(data);
            res.end();
        });
    });

    const data = {
        client_id: config.client_id,
        client_secret: config.client_secret,
        code: code
    };
    ghreq.write(JSON.stringify(data));
    ghreq.end();
}

app.use(cors());

app.post('/', function(req, res) {
    console.log('got request');
    res.setHeader('Allow', 'POST');
    res.setHeader('Accept', 'application/json');
    const data = '';

    console.log('got request with method ', req.method);

    if (req.method !== 'POST') {
        res.writeHead(405);
        res.end();
        return;
    }

    console.log('request is a post as expected');

    const lcHeaders = {};
    for (k in req.headers)
        lcHeaders[k.toLowerCase()] = req.headers[k];

    if (lcHeaders['content-type'] !== 'application/json') {
        res.writeHead(415, 'Content-Type must be application/json');
        res.end();
        return;
    }

    req.on('data', function(chunk) {
        data += chunk;
        if (data.length > 1e6) {
            // body too large
            res.writeHead(413);
            req.connection.destroy();
        }
    });
    req.on('end', function() {
        const body = data != '' ? JSON.parse(data) : undefined;
        getToken(body['code'], res);
    });
});

module.exports = getToken;
