import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import chai, { expect } from 'chai';
import app from '../../index';
import config from '../../config/config';
import User from '../../server/models/user.model';

chai.config.includeStack = true;

describe('## Auth APIs', () => {
  // Email based login
  const validUserCredentialsWithEmail = {
    username: 'react2',
    email: 'react2@email.com',
    name: 'Software Dev',
    password: 'express'
  };

  const validEmailAsUsernameLogin = {
    username: 'react2@email.com',
    password: 'express'
  };

  const validEmailWithUppercaseAsUsernameLogin = {
    username: 'React2@email.com',
    password: 'express'
  };

  const validEmailLogin = {
    email: 'react2@email.com',
    password: 'express'
  };
  const validEmailWithUppercaseLogin = {
    email: 'React2@email.com',
    password: 'express'
  };


  const invalidEmailLogin = {
    email: 'react2@email.com',
    password: 'express21321'
  };

  // -------------------------
  const validUserCredentials = {
    username: 'react',
    password: 'express'
  };

  const validUserCredentialsWithUppercase = {
    username: 'React',
    password: 'express'
  };

  const invalidUserCredentials = {
    username: 'react',
  };

  const invalidLogin = {
    username: 'react',
    password: 'wrong',
  };

  // case insensitive check: lowercase email already registered - with unique username
  const invalidRegisterWithEmailUppercaseUniqueUsername = {
    username: 'react3',
    email: 'React2@email.com',
    name: 'Software Dev',
    password: 'express'
  };

  const invalidRegisterAddEmailCapitalizedUsername = {
    username: 'React',
    email: 'react@email.com',
    password: 'express'
  };

  let jwtToken;

  afterEach((done) => {
    User.remove({}).exec()
      .then(() => {
        done();
      });
  });

  // loginWithEmail
  describe('# POST /api/auth/register (with email & name)', () => {
    it('should get valid JWT token', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentialsWithEmail)
        .expect(httpStatus.CREATED)
        // We make sure we actually login:
        .then((res) => {  //eslint-disable-line
          return request(app)
            .post('/api/auth/loginWithEmail')
            .send(validEmailLogin)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.have.property('token');
          jwt.verify(res.body.token, config.jwtSecret, (err, decoded) => {
            expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
            expect(decoded.username).to.equal(validUserCredentialsWithEmail.username);
            jwtToken = `Bearer ${res.body.token}`;
            done();
          });
        })
        .catch(done);
    });
  });

  // loginWithEmailWithUppercase CASE INSENSITIVE
  describe('# POST /api/auth/register * CASE INSENSITIVE * (with email & name)', () => {
    it('should get valid JWT token', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentialsWithEmail)
        .expect(httpStatus.CREATED)
        // We make sure we actually login:
        .then((res) => {  //eslint-disable-line
          return request(app)
            .post('/api/auth/loginWithEmail')
            .send(validEmailWithUppercaseLogin)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.have.property('token');
          jwt.verify(res.body.token, config.jwtSecret, (err, decoded) => {
            expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
            expect(decoded.username).to.equal(validUserCredentialsWithEmail.username);
            jwtToken = `Bearer ${res.body.token}`;
            done();
          });
        })
        .catch(done);
    });
  });

  describe('# POST /api/auth/loginWithEmail', () => {
    it('should return Authentication error', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentialsWithEmail)
        .expect(httpStatus.CREATED)
        // We want to make sure we reject bad login
        .then((res) => {  //eslint-disable-line
          return request(app)
            .post('/api/auth/loginWithEmail')
            .send(invalidEmailLogin)
            .expect(httpStatus.UNAUTHORIZED);
        })
        .then((res) => {
          expect(res.body.message).to.equal('Password is incorrect.');
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /api/auth/loginWithEmail v2', () => {
    it('should return Authentication error', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentialsWithEmail)
        .expect(httpStatus.CREATED)
        // We want to make sure we reject bad login
        .then((res) => {  //eslint-disable-line
          return request(app)
            .post('/api/auth/loginWithEmail')
          // THIS is an improperly formatted login format without an email field:
            .send(invalidLogin)
            .expect(httpStatus.BAD_REQUEST);
        })
        .then((res) => {
          expect(res.body.message).to.equal('"email" is required');
          done();
        })
        .catch(done);
    });
  });

  // -------- username <-> email login

  describe('# POST /api/auth/register (+ login with email field as username)', () => {
    it('should get valid JWT token', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentialsWithEmail)
        .expect(httpStatus.CREATED)
        // We make sure we actually login:
        .then((res) => {  //eslint-disable-line
          return request(app)
            .post('/api/auth/login')
            .send(validEmailAsUsernameLogin)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.have.property('token');
          jwt.verify(res.body.token, config.jwtSecret, (err, decoded) => {
            expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
            expect(decoded.username).to.equal(validUserCredentialsWithEmail.username);
            jwtToken = `Bearer ${res.body.token}`;
            done();
          });
        })
        .catch(done);
    });
  });

  // CASE INSENSITIVE
  describe('# POST /api/auth/register * CASE INSENSITIVE * (+ login with email field as username) ', () => {
    it('should get valid JWT token', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentialsWithEmail)
        .expect(httpStatus.CREATED)
        // We make sure we actually login:
        .then((res) => {  //eslint-disable-line
          return request(app)
            .post('/api/auth/login')
            .send(validEmailWithUppercaseAsUsernameLogin)
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.have.property('token');
          jwt.verify(res.body.token, config.jwtSecret, (err, decoded) => {
            expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
            expect(decoded.username).to.equal(validUserCredentialsWithEmail.username);
            jwtToken = `Bearer ${res.body.token}`;
            done();
          });
        })
        .catch(done);
    });
  });

  describe('# POST /api/auth/login fail on not including username field', () => {
    it('should return Authentication error', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentialsWithEmail)
        .expect(httpStatus.CREATED)
        // We want to make sure we reject bad login
        .then((res) => {  //eslint-disable-line
          return request(app)
            .post('/api/auth/login')
          // THIS is an improperly formatted loginf ormat without an email field:
            .send(invalidEmailLogin)
            .expect(httpStatus.BAD_REQUEST);
        })
        .then((res) => {
          expect(res.body.message).to.equal('"username" is required');
          done();
        })
        .catch(done);
    });
  });

  // -------- regular register + login unit tests

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

    it('should return User already exists error (same valid credentials)', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentialsWithEmail)
        .expect(httpStatus.CREATED)
        .then((res) => {  //eslint-disable-line
          return request(app)
            .post('/api/auth/register')
            .send(validUserCredentialsWithEmail)
            .expect(httpStatus.UNAUTHORIZED);
        })
        .then((res) => {
          expect(res.body.message).to.equal('User already exists.');
          done();
        })
        .catch(done);
    });

    // CASE INSENSITIVE - lowercase email already registered - with unique username
    it('should return User already exists error - changing email case should not create new user', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentialsWithEmail)
        .expect(httpStatus.CREATED)
        .then((res) => {  //eslint-disable-line
          return request(app)
            .post('/api/auth/register')
            .send(invalidRegisterWithEmailUppercaseUniqueUsername)
            .expect(httpStatus.UNAUTHORIZED);
        })
        .then((res) => {
          expect(res.body.message).to.equal('User already exists.');
          done();
        })
        .catch(done);
    });

    it('should return User already exists error - register without email - reregister with email and  capitalized username', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentials)
        .expect(httpStatus.CREATED)
        .then((res) => {  //eslint-disable-line
          return request(app)
            .post('/api/auth/register')
            .send(invalidRegisterAddEmailCapitalizedUsername)
            .expect(httpStatus.UNAUTHORIZED);
        })
        .then((res) => {
          expect(res.body.message).to.equal('User already exists.');
          done();
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
        .then((res) => {  //eslint-disable-line
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

    it('should get valid JWT token - successful login', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentials)
        .expect(httpStatus.CREATED)
        .then((res) => {  //eslint-disable-line
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

    // CASE INSENSITIVE
    it('should get valid JWT token - CASE INSENSITIVE successful login', (done) => {
      request(app)
        .post('/api/auth/register')
        .send(validUserCredentials)
        .expect(httpStatus.CREATED)
        .then((res) => {  //eslint-disable-line
          return request(app)
            .post('/api/auth/login')
            .send(validUserCredentialsWithUppercase)
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

  xdescribe('# GET /api/auth/:socialNetwork', () => {
    it('should return bad request error', () => {
      // call /api/auth/twitter
    });

    it('should get valid JWT token', () => {
      // call /api/auth/facebook
      // call /api/auth/google
    });
  });
});
