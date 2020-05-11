

import mongoose from 'mongoose';
import Topic from '../server/models/topic.model';
import User from '../server/models/user.model'; // eslint-disable-line
import config from './../config/config';

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

// plugin bluebird promise in mongoose
mongoose.Promise = Promise;
mongoose.connect(config.mongo.host);

// eslint-disable-next-line
module.exports.up = function (next) {
  const db = mongoose.connection;

  db.once('open', () => {
    Topic
      .find({
        maintainer: { $exists: true },
        maintainers: { $exists: false },
      })
      .exec()
      .then((topics) => {
        topics.forEach((topic) => {
          if (topic._id && topic.maintainer) {
            Topic
              .findByIdAndUpdate(topic._id, {
                $set: {
                  maintainers: [topic.maintainer]
                }
              })
              .exec();
          }
        });

        return Promise.resolve();
      })
      .then(() => {
        db.close();
        return next();
      })
      .catch((err) => {
        return next(err);
      });
  });
};

// eslint-disable-next-line
module.exports.down = function (next) {
  next();
};
