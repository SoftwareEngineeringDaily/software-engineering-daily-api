
import jwt from 'jsonwebtoken';
import config from './config';
import notificationCtrl from '../server/controllers/notification.controller';

let server;
let sockets = [];

function setServer(io) {
  server = io;
  server.on('connection', (socket) => {
    socketEvents(socket);
  });
}

function askRegister(socket) {
  socket.emit('app.register');
}

function registerSocket(socket, token) {
  try {
    const data = jwt.verify(token, config.jwtSecret);
    socket.userData = data; // eslint-disable-line no-param-reassign
    socket.registered = true; // eslint-disable-line no-param-reassign
    socket.join('registered');
    return true;
  } catch (e) {
    return false;
  }
}

function socketEvents(socket) {
  sockets.push(socket);
  askRegister(socket);

  socket.on('disconnect', () => {
    clearDisconnected();
  });

  socket.on('register', ({ token }) => {
    const register = registerSocket(socket, token);
    if (register) socket.emit('app.registered');

    notificationCtrl.sendNotifications(socket.userData._id);
  });

  socket.on('markread.all', () => {
    if (socket.userData && socket.userData._id) {
      notificationCtrl.markReadAll(socket.userData._id);
    }
  });
}

function clearDisconnected() {
  sockets = sockets.filter(s => s.connected);
}

function isConnected(userId) {
  return sockets.find(s => s.registered && s.userData && s.userData._id === userId && s.connected);
}

function to(userId) {
  const userSockets = sockets.filter((s) => {
    return s.registered && s.userData && s.userData._id === userId && s.connected;
  });

  return {
    emit(event, data) {
      userSockets.forEach((socket) => {
        socket.emit(event, data);
      });
    }
  };
}

export default {
  get ws() {
    return server;
  },
  setServer,
  isConnected,
  to
};
