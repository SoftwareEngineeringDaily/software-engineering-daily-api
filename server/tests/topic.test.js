import mongoose from 'mongoose';
import moment from 'moment';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import Topic from '../models/topic.model';

const exampleName = 'Example Name';

chai.config.includeStack = true;

function saveMongoArrayPromise(model, dataArray) {
  return Promise.all(dataArray.map(data => model(data).save()));
}

function getRandomNumber() {
  return Math.floor(Math.random() * 10000);
}


/**
 * root level hooks
 */
after((done) => {
  mongoose.models = {};
  mongoose.modelSchemas = {};
  mongoose.connection.close();
  done();
});

describe('## Topic APIs', () => {
  describe('# POST /api/topics', () => {
    it('Create method should create new topic.', (done) => {
      const topic = new Topic();
      topic.name = exampleName;
      topic.save()
        .then((res) => {
          expect(res.name).to.equal(topic.name);
          expect(res.slug).to.equal(topic.slug);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/topics/:topicSlag', () => {
    it('Show method should gets a topic details.', (done) => {
      Topic.findOne({ name: exampleName })
        .then((topicFound) => { //eslint-disable-line
          request(app)
            .get(`/api/topics/${topicFound.slug}`)
            .expect(httpStatus.OK);
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /api/topics/:topicSlug', () => {
    it('Update method should updates a topic.', (done) => {
      Topic.findOne({ name: exampleName })
        .then((topic) => {
          request(app)
            .put(`/api/topics/${topic.slug}`, { status: 'updated' })
            .expect(httpStatus.OK);
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /api/topics/:topicSlug', () => {
    it('Update method should changes topic status for deleted.', (done) => {
      Topic.findOne({ name: exampleName })
        .then((topic) => {
          request(app)
            .delete(`/api/topics/${topic.slug}`)
            .expect(httpStatus.OK);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/topics/mostPopular', () => {
    it('mostPopular method should returns 10 topics with the largest number value of postCount.', (done) => {
      try {
        request(app)
          .delete('/api/topics/mostPopular')
          .expect(httpStatus.OK);
        done();
      } catch (e) {
        console.log(e); //eslint-disable-line
      }
    });
  });

  describe('# GET /api/topics/', () => {
    before((done) => { //eslint-disable-line
      Topic.remove({}, () => {
        done();
      });
    });

    const limitNum = 5;

    const topicsArray = [];
    for (let i = 0; i < limitNum; i += 1) {
      topicsArray.push({
        date: moment().subtract(1, 'minutes'),
        name: `Topics should get all topics ${getRandomNumber()}`,
        slug: `topics-should-get-all-topics-${getRandomNumber()}`
      });
    }

    it('Index method should returns all topics', (done) => {
      const topicsArrayPromise = saveMongoArrayPromise(
        Topic,
        topicsArray
      );

      topicsArrayPromise
        .then((topicFound) => { //eslint-disable-line
          return request(app)
            .get('/api/topics')
            .query({ limit: limitNum })
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(limitNum);
          done();
        })
        .catch(done);
    });
  });
});
