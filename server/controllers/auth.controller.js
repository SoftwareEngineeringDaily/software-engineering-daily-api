import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/config';
import passport from 'passport';
import FacebookTokenStrategy from 'passport-facebook-token';
import User from '../models/user.model';
import { signS3 } from '../helpers/s3';
import _ from 'lodash';

require('dotenv').config();

import aws from 'aws-sdk';


/**
 * @swagger
 * tags:
 * - name: auth
 *   description: User Registration, Login & Authentication
 */

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findOne(id, (err, user) => {
    done(err, user);
  });
});

// TODO: add swagger doc

passport.use(new FacebookTokenStrategy(
  {
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret
  },
  ((accessToken, refreshToken, profile, done) => {
    const username = profile.emails[0].value || profile.id;
    User
      .findOne({ username }).exec()
      .then((user) => {
        if (!user) {
          const newUser = new User();
          newUser.username = username;
          newUser.facebook = {
            email: profile.emails[0].value,
            name: `${profile.name.givenName} ${profile.name.familyName}`,
            id: profile.id,
            token: accessToken
          };
          return newUser.save()
            .then(userSaved => done(null, userSaved));
        }
        return done(null, user);
      })
      .catch((err) => {
      err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
        return done(err);
      });
  })
));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Existing user login
 *     description: Login for existing user. The field username will look up
 *      users the username field but also username will be matched against emails.
 *      This is because of legacy issues.
 *     tags: [auth]
 *     parameters:
 *       - $ref: '#/parameters/userParam'
 *     responses:
 *       '200':
 *         $ref: '#/responses/SuccessfulAuthentication'
 *       '400':
 *         $ref: '#/responses/BadRequest'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */

function login(req, res, next) {
  const username = req.body.username;
  const password = req.body.password;

  User
    .findOne({
      $or: [
        { username },
        { email: username }
      ]
    }).exec()
    .then((user) => {
      if (!user) return res.status(404).json({ message: 'User not found.' });

      if (!user.validPassword(password)) return res.status(401).json({ message: 'Password is incorrect.' });

      const token = jwt.sign(user.toJSON(), config.jwtSecret, { expiresIn: '40000h' });

      return res.status(200).json({
        token,
      });
    })
    .catch((err) => {
      err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
      return next(err);
    });
}

function loginWithEmail(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  User
    .findOne({ email }).exec()
    .then((user) => {
      if (!user) return res.status(404).json({ message: 'User not found.' });

      if (!user.validPassword(password)) return res.status(401).json({ message: 'Password is incorrect.' });

      const token = jwt.sign(user.toJSON(), config.jwtSecret, { expiresIn: '40000h' });

      return res.status(200).json({
        token,
      });
    })
    .catch((err) => {
      err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
      return next(err);
    });
}


/**
 * @swagger
 *   /auth/register:
 *     post:
 *       summary: Register a new user
 *       description: Register a new user
 *       tags: [auth]
 *       parameters:
 *         - in: body
 *           name: user
 *           description: User to register
 *           schema:
 *             $ref: '#/parameters/userParam'
 *           required: true
 *       responses:
 *         '201':
 *           description: successful user creation
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 $ref: '#/definitions/User'
 *               token:
 *                 $ref: '#/definitions/Token'
 *         '400':
 *           $ref: '#/responses/BadRequest'
 *         '401':
 *           description: unauthorized - user already exists. TODO-change to 403-forbidden
 *           schema:
 *             $ref: '#/definitions/Error'
 */

function register(req, res, next) {
  const username = req.body.username;
  const password = req.body.password;

  if (!username) {
    let err = new APIError('Username is required to register.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
    return next(err);
  }

  if (!password) {
    let err = new APIError('Password is required to register.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
    return next(err);
  }

  const email = req.body.email;
  const queryIfEmail = {
    $or: [
      { username },
      { email }
    ]
  };

  const queryIfEmailMissing = {
    $or: [
      { username },
      { email: username }
    ]
  };

  // We do this so people can't share an email on either field, username or email:
  // also so no-one can have the same email or same username.
  const userQuery = email ? queryIfEmail : queryIfEmailMissing;

  User
    .findOne(userQuery).exec()
    .then((user) => {
      if (user) {
        let err = new APIError('User already exists.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
        return next(err);
      }

      const newUser = new User();
      newUser.password = User.generateHash(password);
      // We assign a set of "approved fields"
      const newValues = _.pick(req.body, User.updatableFields);
      Object.assign(newUser, newValues);

      return newUser.save();
    })
    .then((userSaved) => {
      const token = jwt.sign(userSaved.toJSON(), config.jwtSecret, { expiresIn: '40000h' });

      return res.status(201).json({
        user: userSaved,
        token,
      });
    })
    .catch((err) => {
      if (err.message === 'User already exists.') {
        return res.status(401).json({
          message: err.message,
        });
      }
      // return res.status(400).json({err: err});
      const error = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true);
      return next(error);
    });
}

function signS3AvatarUpload(req, res, next) {
  const fileType = req.body.fileType;
  const newFileName = req.user._id;

  const cbSuccess = (result) => {
    res.write(JSON.stringify(result));
    res.end();
  };

  const cbError = () => {
    if (err) {
      console.log(err);
      const error = new APIError('There was a problem getting a signed url', httpStatus.SERVICE_UNAVAILABLE, true);
      return next(error);
    }
  };
  signS3('sd-profile-pictures', fileType, newFileName, cbSuccess, cbError);
}

/**
 *
 */
function socialAuth(req, res, next) {
  const token = jwt.sign(req.user.toJSON(), config.jwtSecret, { expiresIn: '40000h' });
  return res.status(200).json({
    token,
  });
}

/**
 * TODO: add swagger doc
 * This is a protected route. Will return random number only if jwt token is provided in header.
 * @param req
 * @param res
 * @returns {*}
 */
function getRandomNumber(req, res) {
  // req.user is assigned by jwt middleware if valid token is provided
  return res.json({
    user: req.user,
    num: Math.random() * 100
  });
}

export default {
  login, loginWithEmail, getRandomNumber, register, socialAuth, signS3AvatarUpload
};
