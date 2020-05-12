import mongoose from 'mongoose';
import omit from 'lodash/omit';
import flatten from 'lodash/flatten';
import algoliasearch from 'algoliasearch';
import TopicPage from '../server/models/topicPage.model';
import Question from '../server/models/question.model';
import Answer from '../server/models/answer.model'; // eslint-disable-line
import config from './../config/config';

require('dotenv'); // eslint-disable-line

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

// plugin bluebird promise in mongoose
mongoose.Promise = Promise;
mongoose.connect(config.mongo.host, { useMongoClient: true });

function indexTopic(topicId) {
  const client = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_API_KEY,
  );

  const index = client.initIndex(`${process.env.NODE_ENV}_TOPICS`);

  return TopicPage
    .findOne({ topic: topicId })
    .populate('topic')
    .then((topicPage) => {
      return Question
        .find({ entityId: topicId })
        .populate('answers')
        .then((questions) => {
          let answers = questions
            .filter(q => q.answers.length)
            .map((q) => {
              return q.answers.map(a => a.content);
            });

          answers = flatten(answers);

          const _topicPage = topicPage.toObject();
          const slug = (_topicPage.topic && _topicPage.topic.slug) ? _topicPage.topic.slug : '';
          const objectID = _topicPage.searchIndex;
          const updateObject = {
            ...omit(_topicPage, [
              'history',
              '__v',
              'images',
              'searchIndex',
            ]),
            slug,
            answers,
          };

          if (updateObject.topic && updateObject.topic.name) {
            updateObject.topic = updateObject.topic.name;
            updateObject._title = updateObject.topic;
          }

          if (objectID) {
            updateObject.objectID = objectID; // eslint-disable-line
          }

          return index
            [objectID ? 'saveObject' : 'addObject'](updateObject) // eslint-disable-line
            .then((content) => { // eslint-disable-line
              return TopicPage
                .updateOne({ _id: topicPage._id }, { $set: { searchIndex: content.objectID } })
                .then(Promise.resolve);
            });
        });
    });
}

// eslint-disable-next-line
module.exports.up = function (next) {
  const db = mongoose.connection;

  db.once('open', () => {
    TopicPage
      .find({
        searchIndex: { $exists: false },
        published: true,
      })
      .then((topicPages) => {
        const promises = [];

        topicPages.forEach((topicPage) => {
          promises.push(indexTopic(topicPage.topic));
        });

        return Promise.all(promises).then(Promise.resolve);
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
