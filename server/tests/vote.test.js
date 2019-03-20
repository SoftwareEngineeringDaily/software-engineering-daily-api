import mongoose from 'mongoose';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import Vote from '../models/vote.model';
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

describe('## Vote APIs', () => {
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
        post.name = 'post name';
        post.slug = 'post-name';
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
    Vote.remove()
      .exec()
      .then(() => {
        done();
      });
  });

  describe('# GET /api/posts/recommendations', () => {
    let user2;
    let post2;
    const validUserCredentials2 = {
      username: 'react2',
      password: 'express'
    };

    before((done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentials2)
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body).to.have.property('token');
          user2 = res.body.token;
          const postnew = new Post();
          postnew.name = 'New post name';
          postnew.slug = 'new-post-name';
          return postnew.save();
        })
        .then((post) => {
          post2 = post._id;
          done();
        })
        .catch(done);
    });

    it('gets recommendations', (done) => {
      request(app)
        .post(`/api/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${user2}`)
        .expect(httpStatus.OK)
        .then(() =>
          //eslint-disable-line
          request(app)
            .post(`/api/posts/${post2}/upvote`)
            .set('Authorization', `Bearer ${user2}`)
            .expect(httpStatus.OK))
        .then(() =>
          //eslint-disable-line
          request(app)
            .post(`/api/posts/${postId}/upvote`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK))
        .then(() =>
          //eslint-disable-line
          request(app)
            .get('/api/posts/recommendations')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK))
        .then(() => {
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /api/votes', () => {
    it('errors when not logged in', (done) => {
      request(app)
        .post(`/api/posts/${postId}/upvote`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          done();
        });
    });

    it('upvotes a post', (done) => {
      request(app)
        .post(`/api/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const vote = res.body;
          expect(vote.entityId).to.eql(`${postId}`);
          expect(vote.direction).to.eql('upvote');
          expect(vote.active).to.be.true; //eslint-disable-line
          expect(vote.userId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('toggles the upvote for a post', (done) => {
      request(app)
        .post(`/api/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const vote = res.body;
          expect(vote.entityId).to.eql(`${postId}`);
          expect(vote.direction).to.eql('upvote');
          expect(vote.active).to.be.true; //eslint-disable-line
          expect(vote.userId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('downvotes a post', (done) => {
      request(app)
        .post(`/api/posts/${postId}/downvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const vote = res.body;
          expect(vote.entityId).to.eql(`${postId}`);
          expect(vote.direction).to.eql('downvote');
          expect(vote.active).to.be.true; //eslint-disable-line
          expect(vote.userId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('toggles the downvote for a post', (done) => {
      request(app)
        .post(`/api/posts/${postId}/downvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const vote = res.body;
          expect(vote.entityId).to.eql(`${postId}`);
          expect(vote.direction).to.eql('downvote');
          expect(vote.active).to.be.true; //eslint-disable-line
          expect(vote.userId).to.exist; //eslint-disable-line
          return request(app)
            .post(`/api/posts/${postId}/downvote`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          const toggledVote = res.body;
          expect(toggledVote.active).to.be.false; //eslint-disable-line
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/votes/:voteId', () => {
    let savedVote;
    it('should get vote details', (done) => {
      request(app)
        .post(`/api/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          //eslint-disable-line
          savedVote = res.body;
          return request(app)
            .get(`/api/votes/${savedVote._id}`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          //eslint-disable-line
          expect(res.body._id).to.equal(savedVote._id);
          done();
        })
        .catch(done);
    });

    it('should report error with message - Not found, when vote does not exists', (done) => {
      request(app)
        .get('/api/votes/56c787ccc67fc16ccc1a5e92')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.message).to.equal('Not Found');
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/votes/', () => {
    let savedVote;
    it('should get all votes', (done) => {
      request(app)
        .post(`/api/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          savedVote = res.body;
          return request(app)
            .get('/api/votes')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body[0]._id).to.equal(savedVote._id);
          done();
        })
        .catch(done);
    });

    it('should get all votes (with limit and skip)', (done) => {
      request(app)
        .post(`/api/posts/${postId}/downvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then(() =>
          request(app)
            .get('/api/votes')
            .set('Authorization', `Bearer ${userToken}`)
            .query({ limit: 10, skip: 1 })
            .expect(httpStatus.OK))
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.equal(0);
          done();
        })
        .catch(done);
    });
  });
});
