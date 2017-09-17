import mongoose from 'mongoose';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import Favorite from '../models/favorite.model';
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

xdescribe('## Favorite APIs', () => {
  const validUserCredentials = {
    username: 'react',
    password: 'express'
  };

  let userToken;
  let postId;

  before((done) => {
    request(app)
      .post('/api/auth/register')
      .send(validUserCredentials)
      .expect(httpStatus.CREATED)
      .then((res) => {
        expect(res.body).to.have.property('token');
        userToken = res.body.token;
        const post = new Post();
        return post.save();
      })
      .then((post) => {
        postId = post._id;
        done();
      })
      .catch(done);
  });

  after((done) => {
    User.remove({}).exec()
      .then(() => Post.remove({}).exec())
      .then(() => {
        done();
      });
  });

  afterEach((done) => {
    Favorite.remove().exec()
    .then(() => {
      done();
    });
  });

  describe('# GET /api/favorites/:favoriteId', () => {
    it('should get user details', (done) => {
      const favorite = new Favorite();
      favorite.save()
        .then((favorite) => { //eslint-disable-line
          return request(app)
            .get(`/api/favorites/${favorite._id}`)
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
        .get('/api/votes/56c787ccc67fc16ccc1a5e92')
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.message).to.equal('Not Found');
          done();
        })
        .catch(done);
    });
  });
});
