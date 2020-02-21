// adding comment
import mongoose from 'mongoose';
import util from 'util';
import SocketIO from 'socket.io';
import Http from 'http';

// config should be imported before importing any other file
import config from './config/config';
import appExpress from './config/express';
import websocket from './config/websocket';

const app = Http.createServer(appExpress);
const io = SocketIO(app);

websocket.setServer(io);

const debug = require('debug')('express-mongoose-es6-rest-api:index');

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

// plugin bluebird promise in mongoose
mongoose.Promise = Promise;

// connect to mongo db
let mongoUri = config.mongo.host;

if (config.env === 'test') {
  mongoUri = config.mongo.test;
}

mongoose.connect(mongoUri, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE,
  useMongoClient: true,
});
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoUri}`);
});

// print mongoose logs in dev env
if (config.MONGOOSE_DEBUG) {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
  });
}

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {
  // listen on port config.port
  app.listen(config.port, () => {
    console.info(`server started on port ${config.port} (${config.env})`); // eslint-disable-line no-console
  });
}

export default app;
