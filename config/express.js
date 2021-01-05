import express from 'express';
import logger from 'morgan';
import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compress from 'compression';
import passport from 'passport';
import methodOverride from 'method-override';
import cors from 'cors';
import httpStatus from 'http-status';
import expressWinston from 'express-winston';
import expressValidation from 'express-validation';
import helmet from 'helmet';

import http from 'http';
import url from 'url';
// import HttpsProxyAgent from 'https-proxy-agent';
// import request from 'request';

import winstonInstance from './winston';
import routes from '../server/routes/index.route';
import config from './config';
import APIError from '../server/helpers/APIError';

const app = express();

// Setup Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  debug: (config.env === 'development'),
});

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

if (config.env === 'development') {
  app.use(logger('dev'));
}

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(compress());
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

app.use(passport.initialize());

// enable detailed API logging in dev env
if (config.env === 'development') {
  // expressWinston.requestWhitelist.push('body');
  // expressWinston.responseWhitelist.push('body');
  app.use(expressWinston.logger({
    winstonInstance,
    meta: true, // optional: log meta data about request (defaults to true)
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
    colorStatus: true // Color the status code (default green, 3XX cyan, 4XX yellow, 5XX red).
  }));
}

// mount all routes on /api path
app.use('/api', routes);

// The error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// if error is not an instanceOf APIError, convert it.
app.use((err, req, res, next) => {
  if (err instanceof expressValidation.ValidationError) {
    // validation error contains errors which is an array of error each containing message[]
    const unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
    const error = new APIError(unifiedErrorMessage, err.status, true);
    return next(error);
  } else if (!(err instanceof APIError)) {
    const apiError = new APIError(err.message, err.status, err.isPublic);
    return next(apiError);
  }
  return next(err);
});

if (process.env.FEATURE_SERVE_FRONT === true) {
  app.use('/', express.static(`${__dirname}/front-dist`));
}

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new APIError('API not found', httpStatus.NOT_FOUND);
  return next(err);
});

// log error in winston transports except when executing test suite
if (config.env !== 'test') {
  app.use(expressWinston.errorLogger({
    winstonInstance
  }));
}

// handle static IP proxy
if (config.serverUrl) {
  // const proxy = process.env.QUOTAGUARDSTATIC_URL;
  // const agent = new HttpsProxyAgent(proxy);
  // const options = {
  //   uri: config.serverUrl,
  //   method: 'POST',
  //   headers: {
  //     'content-type': 'application/x-www-form-urlencoded'
  //   },
  //   agent,
  //   timeout: 10000,
  //   followRedirect: true,
  //   maxRedirects: 10,
  //   // body: "name=john"
  // };

  // request(options, (error, response, body) => {
  //   console.log(`uri: ${config.serverUrl}`);
  //   console.log(`Error ${error}`);
  //   console.log(`Response: ${response}`);
  //   console.log(`Body: ${body}`);
  // });

  const proxy = url.parse(process.env.QUOTAGUARDSTATIC_URL);
  const target = url.parse(config.serverUrl);
  const options = {
    hostname: proxy.hostname,
    port: proxy.port || 80,
    path: target.href,
    headers: {
      'Proxy-Authorization': `Basic ${new Buffer(proxy.auth).toString('base64')}`, // eslint-disable-line no-buffer-constructor
      Host: target.hostname
    }
  };

  http.get(options, (res) => {
    console.log('config.serverUrl ', config.serverUrl);
    res.pipe(process.stdout);
    return console.log('status code', res.statusCode);
  });
}

// error handler, send stacktrace only during development
app.use((
  err,
  req,
  res,
  next // eslint-disable-line no-unused-vars
) =>
  res.status(err.status).json({
    message: err.isPublic ? err.message : httpStatus[err.status],
    stack: config.env === 'development' ? err.stack : {}
  }));

export default app;
