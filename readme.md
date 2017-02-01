# WIP - quinoa server

``quinoa-server`` is a node application providing diverse back-end services for quinoa apps.

It is supposed to provide three services :

* converting quinoa presentations and stories to ready-to-archive (and use) all-in-one html files for these presentations and stories
* serving a ``REST API`` interface to locally stored quinoa presentations and stories, enabling to list, filter, read, update, create and delete these locally stored documents
* interfacing an app with Github in the Github ``oAuth`` authentication process

To see with which front-end applications this application works and how they play together see :

* [bulgur - presentations making application](https://github.com/medialab/bulgur)
* [fonio - stories making application](https://github.com/medialab/fonio)


# Routes

## Github OAuth proxy

```
GET /oauth-proxy/:code
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


