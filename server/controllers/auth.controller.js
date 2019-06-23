import _ from 'lodash';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import ReCAPTCHA from 'recaptcha2';
import APIError from '../helpers/APIError';
import config from '../../config/config';
import User from '../models/user.model';
import { signS3 } from '../helpers/s3';

const http = require('http'); // For mailchimp api call
require('dotenv').config();

const reCaptcha = new ReCAPTCHA({
  siteKey: config.recaptcha.siteKey,
  secretKey: config.recaptcha.secretKey
});

const REGEX_CASE_INSENSITIVE_MOD = 'i';

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
 *       - in: body
 *         name: user
 *         description: User to login
 *         schema:
 *           $ref: '#/parameters/userParam'
 *         required: true
 *     responses:
 *       '200':
 *         $ref: '#/responses/SuccessfulAuthentication'
 *       '400':
 *         $ref: '#/responses/BadRequest'
 *       '404':
 *         $ref: '#/responses/NotFound'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 */

function login(req, res, next) {
  const { username } = req.body;
  const { password } = req.body;
  User.findOne({
    $or: [
      { username: new RegExp(username, REGEX_CASE_INSENSITIVE_MOD) },
      { email: new RegExp(username, REGEX_CASE_INSENSITIVE_MOD) }
    ]
  })
    .exec()
    .then((user) => {
      if (!user) return res.status(404).json({ message: 'User not found.' });

      if (!user.validPassword(password)) {
        return res.status(401).json({ message: 'Password is incorrect.' });
      }

      const token = jwt.sign(user.toJSON(), config.jwtSecret, { expiresIn: '40000h' });

      return res.status(200).json({
        token
      });
    })
    .catch((err) => {
      err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
      return next(err);
    });
}

function loginWithEmail(req, res, next) {
  const { email } = req.body;
  const { password } = req.body;

  User.findOne({ email: new RegExp(email, REGEX_CASE_INSENSITIVE_MOD) })
    .exec()
    .then((user) => {
      if (!user) return res.status(404).json({ message: 'User not found.' });

      if (!user.validPassword(password)) {
        return res.status(401).json({ message: 'Password is incorrect.' });
      }

      const token = jwt.sign(user.toJSON(), config.jwtSecret, { expiresIn: '40000h' });

      return res.status(200).json({
        token
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
  const { username } = req.body;
  const { password } = req.body;
  const newsletterSignup = req.body.newsletter;
  if (!username) {
    let err = new APIError('Username is required to register.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
    return next(err);
  }

  if (!password) {
    let err = new APIError('Password is required to register.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
    return next(err);
  }
  const { email } = req.body;
  const queryIfEmail = {
    $or: [
      { username: new RegExp(username, REGEX_CASE_INSENSITIVE_MOD) },
      { email: new RegExp(email, REGEX_CASE_INSENSITIVE_MOD) }
    ]
  };

  const queryIfEmailMissing = {
    $or: [
      { username: new RegExp(username, REGEX_CASE_INSENSITIVE_MOD) },
      { email: username }
    ]
  };

  // We do this so people can't share an email on either field, username or email:
  // also so no-one can have the same email or same username.
  const userQuery = email ? queryIfEmail : queryIfEmailMissing;

  // Sign up user for mailchimp list (if checked)
  // console.log(`newsletter status:${newsletterSignup}`);
  try {
    if (newsletterSignup) {
      const postData = JSON.stringify({ status: 'subscribed', email_address: email });
      // Build route because it varies based on API key
      const hostname = `${config.mailchimp.mailchimpKey.split('-')[1]}.api.mailchimp.com`;
      // Build POST options
      const options = {
        hostname,
        path: `/3.0/lists/${config.mailchimp.mailchimpList}/members`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `apikey ${config.mailchimp.mailchimpKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      const mailchimpReq = http.request(options, (mailchimpRes) => {
        mailchimpRes.setEncoding('utf8');
        mailchimpRes.on('data', (body) => {
          console.log(`Body: ${body}`);
        });
      });
      mailchimpReq.on('error', (e) => {
        console.log(`mailchimp error: ${e}`);
        const error = new APIError('Mailchimp error', httpStatus.UNAUTHORIZED, true);
        console.log('newsletter error', error);
        // return next(error); // This will prevent registration which we dont want
      });
      mailchimpReq.write(postData);
      mailchimpReq.end();
    }
  } catch (e) {
    console.log(`mailchimp error: ${e}`);
    const error = new APIError('Mailchimp error', httpStatus.UNAUTHORIZED, true);
    console.log('newsletter error2', error);
    // return next(error); // This will prevent registration which we dont want
  }

  User.findOne(userQuery)
    .exec()
    .then((user) => {
      if (user) {
        let err = new APIError('User already exists.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
        return next(err);
      }

      const newUser = new User();
      newUser.password = User.generateHash(password);
      newUser.signedupForNewsletter = newsletterSignup; // Probably works
      // We assign a set of "approved fields"
      const newValues = _.pick(req.body, User.updatableFields);
      Object.assign(newUser, newValues);

      return newUser.save();
    })
    .then((userSaved) => {
      const token = jwt.sign(userSaved.toJSON(), config.jwtSecret, { expiresIn: '40000h' });

      return res.status(201).json({
        user: userSaved,
        token
      });
    })
    .catch((err) => {
      if (err.message === 'User already exists.') {
        return res.status(401).json({
          message: err.message
        });
      }
      // return res.status(400).json({err: err});
      const error = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true);
      return next(error);
    });
  return null;
}

function signS3AvatarUpload(req, res, next) {
  const { fileType } = req.body;
  const newFileName = req.user._id;

  const cbSuccess = (result) => {
    res.write(JSON.stringify(result));
    res.end();
  };

  // eslint-disable-next-line
  const cbError = err => {
    if (err) {
      console.log(err); // eslint-disable-line
      const error = new APIError(
        'There was a problem getting a signed url',
        httpStatus.SERVICE_UNAVAILABLE,
        true
      );
      return next(error);
    }
  };
  signS3(config.aws.profilePicBucketName, fileType, newFileName, cbSuccess, cbError);
}

/**
 *
 */
function socialAuth(req, res) {
  const token = jwt.sign(req.user.toJSON(), config.jwtSecret, { expiresIn: '40000h' });
  return res.status(200).json({
    token
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

function validateRecaptcha(req, res) {
  const { recaptchaResponse } = req.body;
  reCaptcha.validate(recaptchaResponse)
    .then(() => res.status(200).json({
      formSubmit: true
    }))
    .catch(errorCodes => res.status(401).json({
      formSubmit: false,
      errors: reCaptcha.translateErrors(errorCodes)
    }));
}

export default {
  login,
  loginWithEmail,
  getRandomNumber,
  register,
  socialAuth,
  signS3,
  signS3AvatarUpload,
  validateRecaptcha
};
