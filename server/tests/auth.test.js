import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import chai, { expect } from 'chai';
import app from '../../index';
import config from '../../config/config';
import User from '../../server/models/user.model';

chai.config.includeStack = true;

describe('## Auth APIs', () => {
  const validUserCredentials = {
    username: 'react',
    password: 'express'
  };

  const invalidUserCredentials = {
    username: 'react',
  };

  const invalidLogin = {
    username: 'react',
    password: 'wrong',
  };

  let jwtToken;

  afterEach((done) => {
    User.remove({}).exec()
      .then(() => {
        done();
      });
  })

  describe('# POST /api/auth/register', () => {
    it('should return bad request error', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(invalidUserCredentials)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).to.equal('"password" is required');
          done();
        })
        .catch(done);
    });

    it('should get valid JWT token', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentials)
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body).to.have.property('token');
          jwt.verify(res.body.token, config.jwtSecret, (err, decoded) => {
            expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
            expect(decoded.username).to.equal(validUserCredentials.username);
            jwtToken = `Bearer ${res.body.token}`;
            done();
          });
        })
        .catch(done);
    });
  });

  describe('# POST /api/auth/login', () => {
    it('should return not found with unkown user', (done) => {
      request(app)
        .post('/api/auth/login')
        .send(invalidLogin)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.message).to.equal('User not found.');
          done();
        })
        .catch(done);
    });

    it('should return Authentication error', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentials)
        .expect(httpStatus.CREATED)
        .then((res) => {
          return request(app)
            .post('/api/auth/login')
            .send(invalidLogin)
            .expect(httpStatus.UNAUTHORIZED);
        })
        .then((res) => {
          expect(res.body.message).to.equal('Password is incorrect.');
          done();
        })
        .catch(done);
    });

    it('should get valid JWT token', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentials)
        .expect(httpStatus.CREATED)
        .then((res) => {
          return request(app)
            .post('/api/auth/login')
            .send(validUserCredentials)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.have.property('token');
          jwt.verify(res.body.token, config.jwtSecret, (err, decoded) => {
            expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
            expect(decoded.username).to.equal(validUserCredentials.username);
            jwtToken = `Bearer ${res.body.token}`;
            done();
          });
        })
        .catch(done);
    });
  });

  describe('# GET /api/auth/random-number', () => {
    it('should fail to get random number because of missing Authorization', (done) => {
      request(app)
        .get('/api/auth/random-number')
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });

    it('should fail to get random number because of wrong token', (done) => {
      request(app)
        .get('/api/auth/random-number')
        .set('Authorization', 'Bearer inValidToken')
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });

    it('should get a random number', (done) => {
      request(app)
        .get('/api/auth/random-number')
        .set('Authorization', jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.num).to.be.a('number');
          done();
        })
        .catch(done);
    });
  });
});
