# WIP - quinoa server

``quinoa-server`` is a node application providing diverse back-end services for quinoa apps.

It is supposed to provide the following services :

* converting quinoa presentations and stories to ready-to-use all-in-one html files for these presentations and stories
* serving a ``REST API`` interface to locally stored quinoa presentations and stories, enabling to list, filter, read, update, create and delete these locally stored documents
* interfacing an app with Github in the Github ``oAuth`` authentication process
* serving the content of a gist-stored quinoa presentation

To see with which front-end applications this application works and how they play together see :

* [bulgur - presentations making application](https://github.com/medialab/bulgur)
* [fonio - stories making application](https://github.com/medialab/fonio)

# Routes

## Github OAuth proxy

```
POST /oauth-proxy
```

Returns the token associated to a specific code after dialoging with github oAuth endpoint.

## Presentation rendering to html as a service

```
POST /render-presentation
```

Returns an all-in-one html representation of a quinoa presentation.

## Presentations management on server

```
GET /presentations
```

Returns an object where each keys is a presentation id and the content the related presentation.

```
GET /presentation/:id
```

Returns the json representation of a stored presentation.

```
GET /presentations/:id?format=html
```

Returns the all-in-one/embeddable representation of a stored presentation.

```
PATCH /presentations/:id
```

Updates the given presentation.

```
PUT /presentations/:id
```

Creates the given presentation.

```
DELETE /presentations/:id
```

Deletes the given presentation.

## Locally stored documents' dashboard

```
GET /dashboard
```

Displays a protected dashboard to all locally stored documents, with facilities for producing embed code and deleting documents.

## Gist-based presentation playing

```
GET /gist-presentation/:id
```

Displays as an html static application the content of a gist-stored quinoa presentation.

# Deployment

You have to set the following values as environment variables in production mode :

* ``GITHUB_BULGUR_CLIENT_SECRET`` : the github client secret to use for the bulgur oauth resolution process
* ``GITHUB_BULGUR_CLIENT_ID`` : the github client id to use for the bulgur oauth resolution process
* ``GITHUB_FONIO_CLIENT_SECRET`` : the github client secret to use for the fonio oauth resolution process
* ``GITHUB_FONIO_CLIENT_ID`` : the github client id to use for the fonio oauth resolution process
* ``ADMIN_USERNAME`` : the user name to use to access to the locally stored documents' dashboard
* ``ADMIN_PASSWORD`` : the password to use to access to the locally stored documents' dashboard
* ``PORT`` (optional) : the port to serve the application to

Example for a heroku deployment (in the terminal, after having setup the heroku distant repo) :

```
heroku config:set GITHUB_BULGUR_CLIENT_SECRET=xxxxxxxxxxxxxxx
heroku config:set GITHUB_BULGUR_CLIENT_ID=xxxxxxxxxx
heroku config:set GITHUB_FONIO_CLIENT_SECRET=xxxxxxxxxxxxxxx
heroku config:set GITHUB_FONIO_CLIENT_ID=xxxxxxxxxx
heroku config:set ADMIN_USERNAME=xxxxxxxxxx
heroku config:set ADMIN_PASSWORD=xxxxxxxxxx
```
