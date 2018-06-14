# Quinoa server

``quinoa-server`` is a node application providing diverse back-end services for quinoa client applications.

It is supposed to provide the following services :

* converting quinoa presentations and stories to ready-to-use all-in-one html files for these presentations and stories
* serving a ``REST API`` interface to locally stored quinoa presentations and stories, enabling to list, filter, read, update, create and delete these locally stored documents

To see with which front-end applications this application works and how they play together see :

* [bulgur - presentations making application](https://github.com/medialab/bulgur)
* [fonio - stories making application](https://github.com/medialab/fonio)

# Routes

Each service of the server is accessible through a specific route. Here is a list:

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

## Citation CSL styles

```
GET /citation-styles/
```

Provides a list of all available csl style models in the form `{id, names, title}`.

## Citation CSL style

```
GET /citation-styles/:id
```

Provides a specific citation style in the form:

```
{
  id,// id of the style
  names,// names of the style
  fileName,// name of the file used to represent the style
  data, // representation of the style in xml/csl
  xmlJs,// representation of the style as json
}
```

## Citation CSL locales

```
GET /citation-locales/
```

Provides a list of all available styling locales/languages in the form `{id, names, title}`.

## Citation CSL locale

```
GET /citation-locales/:id
```

Provides a specific citation locale in the form:

```
{
  id,// id of the locale
  names,// names of the locale
  fileName,// name of the file used to represent the locale
  data, // representation of the locale in xml
  xmlJs,// representation of the locale as json
}
```

# Requirements for development

* [git](https://git-scm.com/)
* [node](https://nodejs.org/en/)

# npm scripts

```
npm run test # run mocha testing on each *.spec.js files in ./src dir
npm run start # initializes the server app
npm run build-apps # builds quinoa-presentation-player & quinoa-story-player applications minified bundles
```

# Installing for development

```
git clone https://github.com/medialab/quinoa-server --recursive
cd quinoa-server
npm install
```


# Deployment

Code can be deployed as is (no babel).

You have to set the following values as environment variables in production mode :

* ``ADMIN_USERNAME`` : the user name to use to access to the locally stored documents' dashboard
* ``ADMIN_PASSWORD`` : the password to use to access to the locally stored documents' dashboard
* ``PORT`` (optional) : the port to serve the application to

Example for a heroku deployment (in the terminal, after having setup the heroku distant repo) :

```
heroku config:set ADMIN_USERNAME=xxxxxxxxxx
heroku config:set ADMIN_PASSWORD=xxxxxxxxxx
```