import mongoose from 'mongoose';
import Topic from '../server/models/topic.model';
import User from '../server/models/user.model'; // eslint-disable-line
import config from './../config/config';

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

// eslint-disable-next-line
module.exports.up = function (next) {
  // plugin bluebird promise in mongoose
  mongoose.Promise = Promise;
  mongoose.connect(config.mongo.host, { useMongoClient: true });

  const db = mongoose.connection;

  db.once('open', () => {
    Topic
      .find({
        maintainer: { $exists: true },
        maintainers: { $exists: false },
      })
      .exec()
      .then((topics) => {
        const promises = [];

        topics.forEach((topic) => {
          if (topic._id && topic.maintainer) {
            promises.push(Topic
              .findByIdAndUpdate(topic._id, {
                $set: {
                  maintainers: [topic.maintainer]
                }
              })
              .exec());
          }
        });

        return Promise.all(promises).then(Promise.resolve);
      })
      .then(() => {
        db.close();
        next();
        return Promise.resolve();
      })
      .catch((err) => {
        db.close();
        next(err);
        return Promise.resolve();
      });
  });
};

// eslint-disable-next-line
module.exports.down = function (next) {
  next();
};
