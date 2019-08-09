# Quinoa server

``quinoa-server`` is a node application providing diverse back-end services for quinoa client applications.

# Requirements for development

* [git](https://git-scm.com/)
* [node](https://nodejs.org/en/)

# npm scripts

```
npm run test # run mocha testing on each *.spec.js files in ./src dir
npm run dev # initializes the server app in development mode
npm run start # initializes the server app in production mode
npm run build-apps # builds quinoa-presentation-player & quinoa-story-player applications minified bundles
npm run compose # run docker-compose for starting quinoa and fonio applications
```

# Installing for development

```
git clone https://github.com/medialab/quinoa-server --recursive
cd quinoa-server
npm install
```


# Deployment

Quinoa-server is supposed to be run in a docker infrastructure in production.