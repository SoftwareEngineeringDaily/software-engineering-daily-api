import mongoose from 'mongoose';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import Post from '../models/post.model';

chai.config.includeStack = true;

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {};
  mongoose.modelSchemas = {};
  mongoose.connection.close();
  done();
});

describe('## Post APIs', () => {
  describe('# GET /api/posts/:postId', () => {
    it('should get a post details', (done) => {
      const post = new Post();
      post.save()
        .then((postFound) => { //eslint-disable-line
          return request(app)
            .get(`/api/posts/${postFound._id}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {  //eslint-disable-line
          // expect(res.body.username).to.equal(user.username);
          // expect(res.body.mobileNumber).to.equal(user.mobileNumber);
          done();
        })
        .catch(done);
    });

    it('should report error with message - Not found, when user does not exists', (done) => {
      request(app)
        .get('/api/posts/56c787ccc67fc16ccc1a5e92')
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.message).to.equal('Not Found');
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/posts/', () => {
    before((done) => { //eslint-disable-line
      Post.remove({}, (err, removed) => {
        done();
      });
    });

    let firstSet = [];

    it('should get all posts', (done) => {
      const post = new Post();
      post.save()
        .then((postFound) => { //eslint-disable-line
          return request(app)
            .get('/api/posts')
            .query({ limit: 10 })
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.be.an('array');
          firstSet = res.body;
          done();
        })
        .catch(done);
    });

    it('should get all posts (with limit and skip)', (done) => {
      const createdAtBefore = firstSet[firstSet.length - 1].date;
      const post = new Post();
      post.save()
        .then((postFound) => { //eslint-disable-line
          return request(app)
            .get('/api/posts')
            .query({ limit: 10, createdAtBefore })
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body).to.not.eql(firstSet);
          done();
        })
        .catch(done);
    });
  });
});
