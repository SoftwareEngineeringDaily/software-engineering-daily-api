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
    Vote.remove().exec()
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
          const newPost = new Post();
          return newPost.save();
        })
        .then((postCreated) => {
          post2 = postCreated._id;
          done();
        })
        .catch(done);
    });

    it('gets recommendations', (done) => {
      request(app)
        .post(`/api/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${user2}`)
        .expect(httpStatus.OK)
        .then(() => { //eslint-disable-line
          return request(app)
            .post(`/api/posts/${post2}/upvote`)
            .set('Authorization', `Bearer ${user2}`)
            .expect(httpStatus.OK);
        })
        .then(() => { //eslint-disable-line
          return request(app)
            .post(`/api/posts/${postId}/upvote`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then(() => { //eslint-disable-line
          return request(app)
            .get('/api/posts/recommendations')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
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
          expect(vote.postId).to.eql(`${postId}`);
          expect(vote.direction).to.eql('upvote');
          expect(vote.active).to.be.true; //eslint-disable-line
          expect(vote.userId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('toggles the upvote for a vote', (done) => {
      request(app)
        .post(`/api/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          return request(app)
            .post(`/api/posts/${postId}/upvote`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          const vote = res.body;
          expect(vote.postId).to.eql(`${postId}`);
          expect(vote.direction).to.eql('upvote');
          expect(vote.active).to.be.false; //eslint-disable-line
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
          expect(vote.postId).to.eql(`${postId}`);
          expect(vote.direction).to.eql('downvote');
          expect(vote.active).to.be.true; //eslint-disable-line
          expect(vote.userId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('toggles the downvote for a vote', (done) => {
      request(app)
        .post(`/api/posts/${postId}/downvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          return request(app)
            .post(`/api/posts/${postId}/downvote`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          const vote = res.body;
          expect(vote.postId).to.eql(`${postId}`);
          expect(vote.direction).to.eql('downvote');
          expect(vote.active).to.be.false; //eslint-disable-line
          expect(vote.userId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/votes/:voteId', () => {
    it('should get vote details', (done) => {
      request(app)
        .post(`/api/posts/${postId}/upvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const vote = res.body;
          return request(app)
            .get(`/api/votes/${vote._id}`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {  //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('should report error with message - Not found, when user does not exists', (done) => {
      request(app)
        .get('/api/votes/56c787ccc67fc16ccc1a5e92')
        // .expect(httpStatus.NOT_AUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/votes/', () => {
    it('should get all user votes', (done) => {
      const vote = new Vote();
      vote.save()
        .then((vote) => { //eslint-disable-line
          return request(app)
            .get('/api/votes')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.be.an('array');
          done();
        })
        .catch(done);
    });

    it('should get all votes (with limit and skip)', (done) => {
      request(app)
        .get('/api/votes')
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
});
