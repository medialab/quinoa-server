import express from 'express';
import cors from 'cors';
import socketIO from 'socket.io';
import actionManager from './ducks/actions';
import configureStore from './store/configureStore';

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-fc-token');
  res.header('Access-Control-Allow-Credentials', true);
  next()
});
const server = require('http').createServer(app);

server.listen(PORT, '0.0.0.0', () => console.log(`Listening on ${ PORT }`));
// const server = app.listen(PORT, '0.0.0.0', () => console.log(`Listening on ${ PORT }`));

let numberConnections = 0;

const io = socketIO(server);
const store = configureStore(io);

io.on('connection', (socket) => {
  numberConnections ++;
  io.emit('action', {type:'UPDATE_CONNECTIONS_NUMBER', number: numberConnections});
  socket.emit('action', {type:'SET_SOCKET_ID', payload: socket.id});
  socket.emit('action', {type:'INIT_STATE', payload: store.getState()})
  socket.on('action', (action) => {
    if (action.meta && action.meta.request) {
      store.dispatch(actionManager[action.type]({...action, socket}));
    }
    else
      store.dispatch({...action, socket});
  });
  socket.on('disconnect', () => {
    numberConnections --;
    io.emit('action', {type:'UPDATE_CONNECTIONS_NUMBER', number: numberConnections});
  });
});

