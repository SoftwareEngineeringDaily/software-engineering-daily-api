import mongoose from 'mongoose';
import request from 'supertest-as-promised';
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
    .then(() => Comment.remove({}).exec())
    .then(() => {
      done();
    });
  });

  /*
  afterEach((done) => {
    Comment.remove().exec()
    .then(() => {
      done();
    });
  });*/

  describe('# POST /api/posts/$postId/comment', () => {

      it('errors when not logged in', (done) => {
        request(app)
        .post(`/api/posts/${postId}/comment`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          done();
        });
      });

      it('comment on a post', (done) => {
        const content = 'Hello content!';
        request(app)
        .post(`/api/posts/${postId}/comment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({content})
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body).to.exist;
          const comment = res.body.result;
          expect(comment.post).to.eql(`${postId}`);
          expect(comment.content).to.eql(`${content}`);
          expect(comment.author).to.exist; //eslint-disable-line
          expect(comment.dateCreated).to.exist; //eslint-disable-line
          done();
        })
        .catch(done);
      });


    });

});
