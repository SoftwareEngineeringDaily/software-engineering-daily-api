import mongoose from 'mongoose';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import Listened from '../models/listened.model';
import Post from '../models/post.model';
import User from '../models/user.model';

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

describe('## Listened APIs', () => {
  const validUserCredentials = {
    username: 'react',
    password: 'express'
  };

  let userToken;
  let postId;
  let userId;

  // Create a user and post before running the tests
  before((done) => {
    request(app)
      .post('/api/auth/register')
      .send(validUserCredentials)
      .expect(httpStatus.CREATED)
      .then((res) => {
        expect(res.body).to.have.property('token');
        userToken = res.body.token;
        userId = res.body.user._id;
        const post = new Post();
        return post.save();
      })
      .then((post) => {
        postId = post._id;
        done();
      })
      .catch(done);
  });

  // Clean up
  after((done) => {
    User.remove({}).exec()
      .then(() => Post.remove({}).exec())
      .then(() => {
        done();
      });
  });
  afterEach((done) => {
    Listened.remove().exec()
      .then(() => {
        done();
      });
  });

  describe('# POST /api/posts/{postId}/listened', () => {
    it('mark post as listened by unauthorized user should error', (done) => {
      request(app)
        .post(`/api/posts/${postId}/listened`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          done();
        });
    });

    it('mark post as listened by authorized user should work', (done) => {
      request(app)
        .post(`/api/posts/${postId}/listened`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const listened = res.body;
          expect(listened).to.have.lengthOf(1);
          expect(res.body).to.exist; //eslint-disable-line
          done();
        });
    });
  });

  describe('# GET /api/listened', () => {
    it('returns a list of posts listened by the user should fail when unauthorized', (done) => {
      request(app)
        .get('/api/listened')
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          done();
        });
    });

    it('returns a list of posts listened by the user should work when authorized', (done) => {
      const listened = new Listened({
        userId,
        postId
      });
      listened.save()
        .then(() => {
          return request(app)
            .get('/api/listened')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          const item = res.body;
          expect(item).to.have.lengthOf(1);
          expect(String(item[0].postId)).to.equal(String(postId));
          expect(String(item[0].userId)).to.equal(String(userId));
          expect(res.body).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });
  });
});
