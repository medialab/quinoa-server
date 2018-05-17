import express from 'express';
import cors from 'cors';
import {resolve} from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import socketIO from 'socket.io';
import configureStore from './store/configureStore';

import auth from './routes/auth';
import stories from './routes/stories';
import {writeStories} from './services/stories';

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
let autoSaveInterval;

const io = socketIO(server);
export const store = configureStore();

app.use(function(req, res, next) {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  if(numberConnections === 0) {
      autoSaveInterval = setInterval(() => {
        writeStories()
        .then((res) => {
          // TODO add lastModified timestamp for story
          if(res.length > 0) {
            res.forEach((id) => {
              io.in(id).emit('action', {type: `SAVE_STORIES_FAIL`, payload: {id}})
            });
          }
        })
      }, 2000);
  }
  numberConnections ++;
  io.emit('action', {type:'UPDATE_CONNECTIONS_NUMBER', number: numberConnections});
  socket.emit('action', {type:'SET_SOCKET_ID', payload: socket.id});
  socket.emit('action', {type:'INIT_STATE', payload: store.getState()})
  store.dispatch({type: 'test_dispatch'});
  socket.on('action', (action) => {
    // console.log(action.type);
    store.dispatch(action);
    if (action.meta.broadcast) {
      if (action.meta.room) {
        socket.to(action.meta.room).emit('action', {type: `${action.type}_BROADCAST`, payload: action.payload});
      }
      else {
        socket.broadcast.emit('action', {type: `${action.type}_BROADCAST`, payload: action.payload})
      }
    }
    if (action.type === 'LEAVE_STORY') {
      const rooms = Object.keys(socket.rooms).filter(d => d !== socket.id);
      rooms.forEach((id) => {
        if(io.sockets.adapter.rooms[id].length === 1 && io.sockets.adapter.rooms[id].sockets[socket.id]) {
          store.dispatch({type: 'INACTIVATE_STORY', payload: {id}});
        }
      });
    }
  });

  socket.on('disconnecting', () => {
    const rooms = Object.keys(socket.rooms).filter(d => d !== socket.id);
    store.dispatch({type: 'DISCONNECT', payload: {userId: socket.id, rooms}});
    rooms.forEach((id) => {
      if(io.sockets.adapter.rooms[id].length === 1 && io.sockets.adapter.rooms[id].sockets[socket.id]) {
        store.dispatch({type: 'INACTIVATE_STORY', payload: {id}});
      }
    });
    io.emit('action', {type: 'DISCONNECT', payload: {userId: socket.id, rooms}});
  });
  socket.on('disconnect', () => {
    numberConnections --;
    io.emit('action', {type:'UPDATE_CONNECTIONS_NUMBER', number: numberConnections});
    if(numberConnections === 0) {
      clearInterval(autoSaveInterval);
    }
  });
});

// routers
const storiesFolder = resolve(`${__dirname}/../data/stories`);
app.use('/api/static', express.static(storiesFolder));
const apiRoutes = express.Router();
app.use('/api', apiRoutes);

apiRoutes.use('/auth', auth);
apiRoutes.use('/stories', stories);

