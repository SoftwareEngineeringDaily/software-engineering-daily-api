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

describe('## Favorite APIs', () => {
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

  describe('# POST /api/users', () => {
    it('errors when not logged in', (done) => {
      request(app)
        .post(`/api/posts/${postId}/favorite`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          done();
        });
    });

    it('favorites a post', (done) => {
      request(app)
        .post(`/api/posts/${postId}/favorite`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const favorite = res.body;
          expect(favorite.postId).to.eql(`${postId}`);
          expect(favorite.active).to.be.true; //eslint-disable-line
          expect(favorite.userId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('toggles the favorite for a post', (done) => {
      request(app)
        .post(`/api/posts/${postId}/favorite`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then(res => request(app)
          .post(`/api/posts/${postId}/favorite`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(httpStatus.OK))
        .then((res) => {
          const favorite = res.body;
          expect(favorite.postId).to.eql(`${postId}`);
          expect(favorite.active).to.be.false; //eslint-disable-line
          expect(favorite.userId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('unfavorites a post', (done) => {
      request(app)
        .post(`/api/posts/${postId}/unfavorite`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const favorite = res.body;
          expect(favorite.postId).to.eql(`${postId}`);
          expect(favorite.active).to.be.false; //eslint-disable-line
          expect(favorite.userId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/favorites/:favoriteId', () => {
    let favorite;
    it('should get favorite details', (done) => {
      request(app)
        .post(`/api/posts/${postId}/favorite`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          favorite = res.body;
          return request(app)
            .get(`/api/favorites/${favorite._id}`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {  //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('should report error with message - Not found, when favorite does not exists', (done) => {
      request(app)
        .get('/api/favorites/56c787ccc67fc16ccc1a5e92')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.message).to.equal('Not Found');
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/favorites/', () => {
    let favorite;
    it('should get all favorites', (done) => {
      request(app)
        .post(`/api/posts/${postId}/favorite`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          favorite = res.body;
          return request(app)
            .get('/api/favorites')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body[0]._id).to.equal(favorite._id);
          done();
        })
        .catch(done);
    });

    it('should get all favorites (with limit and skip)', (done) => {
      request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ limit: 10, skip: 1 })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.be.an('array');
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/posts/ bookmarked/favorited status', () => {
    let favorite;
    it('should have bookmarked undefined if not auth', (done) => {
      request(app)
        .get('/api/posts')
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body[0].bookmarked).to.be.undefined; //eslint-disable-line
          done();
        })
        .catch(done);
    });
    it('should have bookmarked false by default', (done) => {
      request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body[0].bookmarked).to.equal(false);
          done();
        })
        .catch(done);
    });
    it('should have bookmarked true if bookmarked/favorited', (done) => {
      request(app)
        .post(`/api/posts/${postId}/favorite`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          favorite = res.body;
          return request(app)
            .get('/api/posts')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body[0]._id).to.equal(favorite.postId);
          expect(res.body[0].bookmarked).to.equal(true);
          done();
        })
        .catch(done);
    });
    it('should have bookmarked false if un-bookmarked/favorited', (done) => {
      request(app)
        .post(`/api/posts/${postId}/favorite`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then(() => request(app)
          .post(`/api/posts/${postId}/unfavorite`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(httpStatus.OK))
        .then(() => request(app)
          .get('/api/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(httpStatus.OK))
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body[0].bookmarked).to.equal(false);
          done();
        })
        .catch(done);
    });
  });
});
