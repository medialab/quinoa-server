import express from 'express';
import cors from 'cors';
import {resolve} from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import socketIO from 'socket.io';
import configureStore from './store/configureStore';

import auth from './routes/auth';
import stories from './routes/stories';

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-fc-token');
  res.header('Access-Control-Allow-Credentials', true);
  next()
});

app.use(morgan('dev'));
// parse application/json
app.use(bodyParser.json({limit: '20mb'}));
app.use(bodyParser.urlencoded({limit: '20mb', extended: true}));

const server = require('http').createServer(app);
server.listen(PORT, '0.0.0.0', () => console.log(`Listening on ${ PORT }`));
// const server = app.listen(PORT, '0.0.0.0', () => console.log(`Listening on ${ PORT }`));

let numberConnections = 0;

const io = socketIO(server);
export const store = configureStore();

app.use(function(req, res, next) {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  numberConnections ++;
  io.emit('action', {type:'UPDATE_CONNECTIONS_NUMBER', number: numberConnections});
  socket.emit('action', {type:'SET_SOCKET_ID', payload: socket.id});
  socket.emit('action', {type:'INIT_STATE', payload: store.getState()})
  store.dispatch({type: 'test_dispatch'});
  socket.on('action', (action) => {
    store.dispatch(action);
    if (action.meta.broadcast) {
      if (action.meta.room) {
        socket.to(action.meta.room).emit('action', {type: `${action.type}_BROADCAST`, payload: action.payload});
      }
      else {
        socket.broadcast.emit('action', {type: `${action.type}_BROADCAST`, payload: action.payload})
      }
    }
  });
  socket.on('disconnecting', () => {
    const rooms = Object.keys(socket.rooms).filter(d => d !== socket.id);
    store.dispatch({type: 'DISCONNECT', payload: {userId: socket.id, rooms}});
    io.emit('action', {type: 'DISCONNECT', payload: {userId: socket.id, rooms}});
  });
  socket.on('disconnect', () => {
    numberConnections --;
    io.emit('action', {type:'UPDATE_CONNECTIONS_NUMBER', number: numberConnections});
  });
});

// routers
const storiesFolder = resolve(`${__dirname}/../data/stories`);
app.use('/api/static', express.static(storiesFolder));

const apiRoutes = express.Router();
app.use('/api', apiRoutes);

apiRoutes.use('/auth', auth);
apiRoutes.use('/stories', stories);

