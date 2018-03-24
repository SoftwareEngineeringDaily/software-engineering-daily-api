import mongoose from 'mongoose';
import request from 'supertest-as-promised';
import moment from 'moment';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import Comment from '../models/comment.model';
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

describe('## Comment APIs', () => {
  const validUserCredentials = {
    username: 'react',
    password: 'express'
  };

  let userToken;
  let postId;
  let commentId;
  let replyId;

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
    User.remove({})
      .exec()
      .then(() => Post.remove({}).exec())
      .then(() => Comment.remove({}).exec())
      .then(() => {
        done();
      });
  });

  describe('# POST /api/comments/forEntity/$postId', () => {
    it('errors when not logged in', (done) => {
      request(app)
        .post(`/api/comments/forEntity/${postId}`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          done();
        });
    });

    it('comment on a post', (done) => {
      const content = 'Hello content!';
      request(app)
        .post(`/api/comments/forEntity/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content })
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          const comment = res.body.result;
          expect(comment.rootEntity).to.eql(`${postId}`);
          expect(comment.content).to.eql(`${content}`);
          expect(comment.author).to.exist; //eslint-disable-line
          expect(comment.dateCreated).to.exist; //eslint-disable-line

          commentId = comment._id;
          done();
        })
        .catch(done);
    });

    it('should get comments', (done) => {
      request(app)
        .get(`/api/comments/forEntity/${postId}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          expect(res.body.result).to.be.an('array');
          done();
        })
        .catch(done);
    });

    it('should reply a comment', (done) => {
      const content = 'Hello reply content!';
      request(app)
        .post(`/api/comments/forEntity/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content,
          parentCommentId: commentId
        })
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          const reply = res.body.result;
          expect(reply.rootEntity).to.eql(`${postId}`);
          expect(reply.content).to.eql(`${content}`);
          expect(reply.parentComment).to.eql(`${commentId}`);
          expect(reply.author).to.exist; //eslint-disable-line
          expect(reply.dateCreated).to.exist; //eslint-disable-line

          replyId = reply._id;
          done();
        })
        .catch(done);
    });

    it('should like/upvote comments', (done) => {
      request(app)
        .post(`/api/comments/${commentId}/upvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          const vote = res.body;
          expect(vote.direction).to.exist; //eslint-disable-line
          expect(vote.userId).to.exist; //eslint-disable-line
          expect(vote.entityId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('should like/upvote replies', (done) => {
      request(app)
        .post(`/api/comments/${replyId}/upvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          const vote = res.body;
          expect(vote.direction).to.exist; //eslint-disable-line
          expect(vote.userId).to.exist; //eslint-disable-line
          expect(vote.entityId).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('should delete a comment', (done) => {
      request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.exist; // eslint-disable-line
          expect(res.body.deleted);
          done();
        })
        .catch(done);
    });

    it('should return transformed deleted comment', (done) => {
      const content = 'Deleted';
      request(app)
        .get(`/api/comments/forEntity/${postId}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const deletedComment = res.body.result.find(c => c.deleted === true);
          if (deletedComment) {
            const deleteDate = moment(deletedComment.dateDeleted).format('MM/DD/YYYY HH:mm:ss');

            expect(deletedComment).to.have.property('dateDeleted');
            expect(deletedComment.content).to.contain(`${content}`);
            expect(deletedComment.content).to.contain(deleteDate);
          }
          done();
        })
        .catch(done);
    });
  });
});
