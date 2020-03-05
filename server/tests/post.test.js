import mongoose from 'mongoose';
import moment from 'moment';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import Post from '../models/post.model';
import User from '../models/user.model';

chai.config.includeStack = true;

function saveMongoArrayPromise(model, dataArray) {
  // this moved later into util file for use by multiple models and tests
  return Promise.all(dataArray.map(data => model(data).save()));
}

function getRandomNumber() {
  return Math.floor(Math.random() * 10000);
}

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
      Post.remove({}, () => {
        done();
      });
    });

    let firstSet = [];
    const limitNum = 5;

    const postsArray = [];
    for (let i = 0; i < limitNum; i += 1) {
      postsArray.push({
        date: moment().subtract(1, 'minutes'),
        name: `Posts should get all posts ${getRandomNumber()}`,
        slug: `posts-should-get-all-posts-${getRandomNumber()}`
      });
    }

    it('should get all posts', (done) => {
      const postsArrayPromise = saveMongoArrayPromise(
        Post,
        postsArray
      );

      postsArrayPromise
        .then((postFound) => { //eslint-disable-line
          return request(app)
            .get('/api/posts')
            .query({ limit: limitNum })
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(limitNum);
          firstSet = res.body;
          done();
        })
        .catch(done);
    });

    it('should get all posts (with limit and skip)', (done) => {
      const createdAtBeforeNotFormatted = moment(firstSet[0].date).add(1, 'minutes');
      const createdAtBefore = moment(createdAtBeforeNotFormatted, moment.ISO_8601).format();
      request(app)
        .get('/api/posts')
        .query({ limit: limitNum, createdAtBefore })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(limitNum);
          expect(res.body).to.eql(firstSet);
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /api/posts/:postId/like', () => {
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
      User.remove({})
        .exec()
        .then(() => Post.remove({}).exec())
        .then(() => {
          done();
        });
    });

    it('errors when not logged in', (done) => {
      request(app)
        .post(`/api/posts/${postId}/like`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          done();
        });
    });

    it('likes a post', (done) => {
      request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const like = res.body;
          expect(like).to.have.property('likeCount').that.is.a('number');
          expect(like).to.have.property('likeActive').that.is.a('boolean');
          expect(like.likeActive).to.be.true; //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('toggles the like for a post', (done) => {
      request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const like = res.body;
          expect(like).to.have.property('likeCount').that.is.a('number');
          expect(like).to.have.property('likeActive').that.is.a('boolean');
          expect(like.likeActive).to.be.false; //eslint-disable-line
          done();
        })
        .catch(done);
    });
  });

  xdescribe('# GET /api/posts/search', () => {
    it('returns search results', (done) => {
      request(app)
        .get('/api/posts/search?query=apple&page=0')
        .then((res) => {
          expect(res.body).to.exist; //eslint-disable-line
          expect(res.body.posts).to.have.property('length'); //eslint-disable-line
          expect(res.body).to.have.property('isEnd').that.is.a('boolean');
          expect(res.body).to.have.property('nextPage', 1).that.is.a('number');
          done();
        });
    });
  });
});
