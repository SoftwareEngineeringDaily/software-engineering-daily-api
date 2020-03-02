import mongoose from 'mongoose';
// import moment from 'moment';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import Post from '../models/post.model';
import User from '../models/user.model';
import RelatedLink from '../models/relatedLink.model';

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

describe('## Post with relatedLink APIs', () => {
  const firstUserCredentials = {
    username: 'user1',
    password: 'express'
  };
  let firstUserToken;
  let firstUserId;
  const secondUserCredentials = {
    username: 'user2',
    password: 'express'
  };
  let secondUserToken;
  let postId;

  const relatedLinkData = {
    url: 'https://softwareengineeringdaily.com/2020/02/24/infrastructure-management-with-joey-parsons/'
  };

  before((done) => {
    request(app)
      .post('/api/auth/register')
      .send(firstUserCredentials)
      .expect(httpStatus.CREATED)
      .then((res) => {
        expect(res.body).to.have.property('token');
        firstUserToken = res.body.token;
        firstUserId = res.body.user._id;
        request(app)
          .post('/api/auth/register')
          .send(secondUserCredentials)
          .expect(httpStatus.CREATED)
          .then((res2) => {
            expect(res2.body).to.have.property('token');
            secondUserToken = res2.body.token;
            const post = new Post();
            return post.save();
          })
          .then((post) => {
            postId = post._id;
            done();
          });
      })
      .catch(done);
  });

  after((done) => {
    User.remove({})
      .exec()
      .then(() => Post.remove({}).exec())
      .then(() => done());
  });

  afterEach((done) => {
    RelatedLink.remove({})
      .exec()
      .then(() => done());
  });

  describe('# POST /api/posts/:postId/related-link', () => {
    it('adds related link if authenticated', (done) => {
      request(app)
        .post(`/api/posts/${postId}/related-link`)
        .set('Authorization', `Bearer ${firstUserToken}`)
        .send(relatedLinkData)
        .expect(httpStatus.CREATED)
        .then((res) => { //eslint-disable-line
          const relatedLink = res.body;
          expect(relatedLink.icon).to.be.a('string');
          expect(relatedLink.title).to.be.a('string');
          expect(relatedLink.url).to.eql(relatedLinkData.url);
          expect(relatedLink.author).to.eql(firstUserId.toString());
          expect(relatedLink.post).to.eql(postId.toString());
          expect(relatedLink.score).to.eql(0);
          expect(relatedLink.clicks).to.eql(0);
          expect(relatedLink.deleted).to.eql(false);
          done();
        })
        .catch(done);
    });

    it('reports error if unauthenticated', (done) => {
      request(app)
        .post(`/api/posts/${postId}/related-link`)
        .send(relatedLinkData)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/posts/:postId/related-links', () => {
    it('gets related links with post if authenticated', (done) => {
      request(app)
        .post(`/api/posts/${postId}/related-link`)
        .set('Authorization', `Bearer ${firstUserToken}`)
        .send(relatedLinkData)
        .expect(httpStatus.CREATED)
        .then(() => { //eslint-disable-line
          return request(app)
            .get(`/api/posts/${postId}/related-links`)
            .set('Authorization', `Bearer ${firstUserToken}`)
            .send()
            .expect(httpStatus.OK)
            .then((res) => {
              const relatedLink = res.body[0];
              expect(relatedLink.icon).to.be.a('string');
              expect(relatedLink.title).to.be.a('string');
              expect(relatedLink.url).to.eql(relatedLinkData.url);
              expect(relatedLink.post).to.eql(postId.toString());
              expect(relatedLink.score).to.eql(0);
              expect(relatedLink.clicks).to.eql(0);
              expect(relatedLink.upvoted).to.eql(false);
              expect(relatedLink.downvoted).to.eql(false);
              done();
            });
        })
        .catch(done);
    });
    it('gets related links with post if unauthenticated', (done) => {
      request(app)
        .post(`/api/posts/${postId}/related-link`)
        .set('Authorization', `Bearer ${firstUserToken}`)
        .send(relatedLinkData)
        .expect(httpStatus.CREATED)
        .then(() => { //eslint-disable-line
          return request(app)
            .get(`/api/posts/${postId}/related-links`)
            .send()
            .expect(httpStatus.OK)
            .then((res) => {
              const relatedLink = res.body[0];
              expect(relatedLink.icon).to.be.a('string');
              expect(relatedLink.title).to.be.a('string');
              expect(relatedLink.url).to.eql(relatedLinkData.url);
              expect(relatedLink.post).to.eql(postId.toString());
              expect(relatedLink.score).to.eql(0);
              expect(relatedLink.clicks).to.eql(0);
              expect(relatedLink.upvoted).to.eql(false);
              expect(relatedLink.downvoted).to.eql(false);
              done();
            });
        })
        .catch(done);
    });
  });

  describe('# DELETE /api/related-links/:relatedLinkId', () => {
    it('deletes related link if own link', (done) => {
      request(app)
        .post(`/api/posts/${postId}/related-link`)
        .set('Authorization', `Bearer ${firstUserToken}`)
        .send(relatedLinkData)
        .expect(httpStatus.CREATED)
        .then((res) => { //eslint-disable-line
          return res.body._id;
        })
        .then((relatedLinkId) => { //eslint-disable-line
          return request(app)
            .delete(`/api/related-links/${relatedLinkId}`)
            .set('Authorization', `Bearer ${firstUserToken}`)
            .send()
            .expect(httpStatus.OK)
            .then((res) => { //eslint-disable-line
              expect(res.body.deleted).to.eql(true);
              done();
            });
        })
        .catch(done);
    });
    it('sends error if unauthenticated', (done) => {
      request(app)
        .post(`/api/posts/${postId}/related-link`)
        .set('Authorization', `Bearer ${firstUserToken}`)
        .send(relatedLinkData)
        .expect(httpStatus.CREATED)
        .then((res) => { //eslint-disable-line
          return res.body._id;
        })
        .then((relatedLinkId) => { //eslint-disable-line
          return request(app)
            .delete(`/api/related-links/${relatedLinkId}`)
            .send()
            .expect(httpStatus.UNAUTHORIZED)
            .then((res) => { //eslint-disable-line
              expect(res.body.message).to.eql('Unauthorized');
              done();
            });
        })
        .catch(done);
    });
    it('sends error if not own link', (done) => {
      request(app)
        .post(`/api/posts/${postId}/related-link`)
        .set('Authorization', `Bearer ${firstUserToken}`)
        .send(relatedLinkData)
        .expect(httpStatus.CREATED)
        .then((res) => { //eslint-disable-line
          return res.body._id;
        })
        .then((relatedLinkId) => { //eslint-disable-line
          return request(app)
            .delete(`/api/related-links/${relatedLinkId}`)
            .set('Authorization', `Bearer ${secondUserToken}`)
            .send()
            .expect(httpStatus.UNAUTHORIZED)
            .then((res) => { //eslint-disable-line
              // TODO: Consider consistency with other error messages
              expect(res.body.Error).to.eql('Please login');
              done();
            });
        })
        .catch(done);
    });
  });
});
