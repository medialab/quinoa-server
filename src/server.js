import express from 'express';
import cors from 'cors';
import {resolve} from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import config from 'config';

import socketIO from 'socket.io';
import store from './store/configureStore';

import socketEventHandler from './socketEventHandler';

import auth from './routes/auth';
import stories from './routes/stories';
import resources from './routes/resources';

import chron from '../chron';


const PORT = config.get('port');
const dataFolder = config.get('dataFolder');
const maxStorySize = config.get('maxStorySize');
const maxResourceSize = config.get('maxResourceSize');

const app = express();
app.use(cors());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-fc-token');
  res.header('Access-Control-Allow-Credentials', true);
  next()
});

app.use(morgan('dev'));

app.use(bodyParser.urlencoded({limit: maxStorySize, extended: true}));

const server = require('http').createServer(app);
server.listen(PORT, '0.0.0.0', () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server, {path: '/sockets'});

app.use(function(req, res, next) {
  req.io = io;
  next();
});

socketEventHandler(io, store);

// routers
const storiesFolder = resolve(`${dataFolder}/stories`);

// if nginx serves static file we don't need express to do it
const NGINX_STATIC = process.env.NGINX_STATIC;

if (!NGINX_STATIC)
  app.use('/static', express.static(storiesFolder));

const apiRoutes = express.Router();
app.use('/api', apiRoutes);

apiRoutes.use('/auth', bodyParser.json(), auth);
apiRoutes.use('/stories', bodyParser.json({limit: maxStorySize}), stories);
apiRoutes.use('/resources', bodyParser.json({limit: maxResourceSize}), resources);
