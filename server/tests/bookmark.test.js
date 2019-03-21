import mongoose from 'mongoose';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import Bookmark from '../models/favorite.model';
import Post from '../models/post.model';
import User from '../models/user.model';

chai.config.includeStack = true;

/**
 * This is duplicate of favorite.test. We can remove favorite once all clients
 * have migrated to use bookmark routes/elements only
 */

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

describe('## Bookmark APIs', () => {
  const validUserCredentials = {
    username: 'react',
    password: 'express'
  };

  let userToken;
  let postId;
  let userId;

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

  after((done) => {
    User.remove({})
      .exec()
      .then(() => Post.remove({}).exec())
      .then(() => {
        done();
      });
  });

  afterEach((done) => {
    Bookmark.remove()
      .exec()
      .then(() => {
        done();
      });
  });

  describe('# POST /api/posts/:postId/bookmark', () => {
    it('errors when not logged in', (done) => {
      request(app)
        .post(`/api/posts/${postId}/bookmark`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          done();
        });
    });

    it('bookmarks a post', (done) => {
      request(app)
        .post(`/api/posts/${postId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const bookmark = res.body;
          expect(bookmark.postId).to.eql(`${postId}`);
          expect(bookmark.active).to.be.true; //eslint-disable-line
          expect(bookmark.userId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('toggles the bookmark for a post', (done) => {
      request(app)
        .post(`/api/posts/${postId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then(() =>
          request(app)
            .post(`/api/posts/${postId}/bookmark`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK))
        .then((res) => {
          const bookmark = res.body;
          expect(bookmark.postId).to.eql(`${postId}`);
          expect(bookmark.active).to.be.false; //eslint-disable-line
          expect(bookmark.userId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('unbookmarks a post', (done) => {
      request(app)
        .post(`/api/posts/${postId}/unbookmark`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const bookmark = res.body;
          expect(bookmark.postId).to.eql(`${postId}`);
          expect(bookmark.active).to.be.false; //eslint-disable-line
          expect(bookmark.userId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/bookmarks/:bookmarkId', () => {
    let bookmark;
    it('should get bookmark details', (done) => {
      request(app)
        .post(`/api/posts/${postId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          bookmark = res.body;
          return request(app)
            .get(`/api/bookmarks/${bookmark._id}`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then(() => {
          done();
        })
        .catch(done);
    });

    it('should report error with message - Not found, when bookmark does not exists', (done) => {
      request(app)
        .get('/api/bookmarks/56c787ccc67fc16ccc1a5e92')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.message).to.equal('Not Found');
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/bookmarks/', () => {
    let bookmark;
    it('should get all bookmarks', (done) => {
      request(app)
        .post(`/api/posts/${postId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          bookmark = res.body;
          return request(app)
            .get('/api/bookmarks')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body[0]._id).to.equal(bookmark._id);
          done();
        })
        .catch(done);
    });

    it('should get all bookmarks (with limit and skip)', (done) => {
      request(app)
        .get('/api/bookmarks')
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

  describe('# GET /api/posts/ bookmarked status', () => {
    let bookmark;
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
    it('should have bookmarked true if bookmarked', (done) => {
      request(app)
        .post(`/api/posts/${postId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          bookmark = res.body;
          return request(app)
            .get('/api/posts')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body[0]._id).to.equal(bookmark.postId);
          expect(res.body[0].bookmarked).to.equal(true);
          done();
        })
        .catch(done);
    });
    it('should have bookmarked false if unbookmarked', (done) => {
      request(app)
        .post(`/api/posts/${postId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then(() =>
          request(app)
            .post(`/api/posts/${postId}/unbookmark`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK))
        .then(() =>
          request(app)
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

  describe('# GET /api/users/:userId/bookmarked', () => {
    it('should get bookmarked with userId', (done) => {
      request(app)
        .post(`/api/posts/${postId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then(() =>
          request(app)
            .get(`/api/users/${userId}/bookmarked`)
            .expect(httpStatus.OK))
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body[0]._id).to.equal(`${postId}`);
          done();
        })
        .catch(done);
    });
    it('should get bookmarked for authenticated user with "me" shortcut', (done) => {
      request(app)
        .post(`/api/posts/${postId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then(() =>
          request(app)
            .get('/api/users/me/bookmarked')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK))
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body[0]._id).to.equal(`${postId}`);
          done();
        })
        .catch(done);
    });
    it('should not get non-bookmarked for authenticated user with "me" shortcut', (done) => {
      request(app)
        .post(`/api/posts/${postId}/bookmark`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then(() =>
          request(app)
            .post(`/api/posts/${postId}/unbookmark`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK))
        .then(() =>
          request(app)
            .get('/api/users/me/bookmarked')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK))
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(0);
          done();
        })
        .catch(done);
    });
    // as posts are "saved" from WordPress without Mongoose, they will not include defaults
    // test to ensure the default is returned with query - see GitHub issue #199
    it('should include Post score even if undefined', (done) => {
      // let postIdNoScore;
      const postNoScore = new Post();
      postNoScore.name = 'Bookmark no score test name';
      postNoScore.slug = 'bookmark-no-score-test-name';
      postNoScore.score = undefined;
      expect(postNoScore.toObject()).to.not.have.keys('score');
      postNoScore.save().then(post => post._id).then((postIdNoScore) => {
        request(app)
          .post(`/api/posts/${postIdNoScore}/bookmark`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(httpStatus.OK)
          .then(() =>
            request(app)
              .get('/api/users/me/bookmarked')
              .set('Authorization', `Bearer ${userToken}`)
              .expect(httpStatus.OK))
          .then((res) => {
            expect(res.body).to.be.an('array');
            expect(res.body).to.have.lengthOf(1);
            expect(res.body[0]._id).to.equal(`${postIdNoScore}`);
            expect(res.body[0].score).to.equal(0);
            done();
          })
          .catch(done);
      });
    });
  });
});
