import APIError from '../helpers/APIError';
import httpStatus from 'http-status';

import randomstring from "randomstring";
// TODO: validate this key and pull from config:
import Favorite from '../models/favorite.model';
import _ from 'lodash';
import User from '../models/user.model';
import PasswordReset from '../models/passwordReset.model';
import config from '../../config/config';
const sgMail = require('@sendgrid/mail');
//TODO: move this out of here:
sgMail.setApiKey(process.env.SEND_GRID_KEY); // TODO: replace this with confi

/**
 * @swagger
 * tags:
 * - name: user
 *   description: User-related info and lists
 */

/**
 * @swagger
 * parameters:
 *   userId:
 *     name: userId
 *     in: path
 *     description: Mongo ObjectId of user
 *     required: true
 *     type: string
 */
function load(req, res, next, id) {
  User.get(id)
    .then((user) => {
      delete user.password;
      req.userLoaded = user; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}
/**
 * Get currently logged in user
 * @returns {User}
 */
function me(req, res, next) {
  User.get(req.user._id)
    .then((user) => {
      user.password = null;
      return res.json(user);
    })
    .catch(e => next(err));
}

/**
 * Get user
 * @returns {User}
 */
function get(req, res) {
  const user = req.userLoaded.toObject();
  delete user.password;
  delete user.email;
  return res.json(user);
}

// Bucket name:
// sd-profile-pictures

/**
 * Update existing user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {User}
 */
function update(req, res, next) {
  const user = req.userLoaded;
  const username = req.body.username;
  const avatarWasSet = req.body.isAvatarSet;
  // We gotta check a few things:
  // First we make sure we are the actual user we are modifying.
  if (!req.user || user._id != req.user._id) {
    let err = new APIError('Not enough  permissions to modify that user.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
    return next(err);
  }

  // Next we are making sure the username doens't already exist:
  User.findOne({ username })
  .exec()
  .then((_user) => {
    if (_user && _user.id != user.id) {
      let err = new APIError('User already exists.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
      return next(err);
    }
    // Using _.pick to only get a few properties:
    // otherwise user can set themselves to verified, etc :)
    const newValues = _.pick(req.body, User.updatableFields);
    Object.assign(user, newValues);
    if (avatarWasSet) {
      // This should be pulled from utils:
      const S3_BUCKET = 'sd-profile-pictures';
      user.avatarUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${user._id}`
    }
    return user.save().then((newUser) => {
      const userMinusPassword = Object.assign({}, newUser, {password: null});
      res.json(userMinusPassword);
    })
  })
  .catch(e => {
    console.log('error saving user', e);
    next(e)
  });
}

function regainPassword(req, res, next) {
  const { userKey, newPassword, userId } = req.body;
  const hash = User.generateHash(userKey);
  console.log('userkey.len', userKey.length);
  console.log('------------------ userKey', userKey);
  console.log('---------newPassword', newPassword);
  console.log('---------hash', hash);
  PasswordReset.findOne({ $and: [
    {userId}
  ]}).exec()
  .then( (passwordReset) => {
    if (!passwordReset) {
      console.log('Invalid passwordReset', passwordReset);
      throw 'Invalid reset password.';
    }

    console.log('cehcking validHash...');
    if (!User.isValidHash({hash, original: userKey})){
      console.log('---------Invalid hash-----------');
      throw 'Invalid reset password.';
    }
    console.log('passwordReset.dateCreated', passwordReset.dateCreated);

    // Check that dateCreated is within a certain time period:
    const date1 = new Date(passwordReset.dateCreated);
    const date2 = new Date(); // today
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    console.log('diffDays', diffDays);
    // TODO: delete entry in db for PasswordResetSchema
    // TODO: return JWT token
    res.json({success: true});
  })
  .catch((error) => {
    console.log('------------------------', error);
    next(error);
  });
}

function requestPasswordReset(req, res, next) {
  const { email }  = req.body;
  User.findOne({ $or: [
    {username: email},
    {email}
  ]}).exec()
  .then( (user) => {
    if (!user) return res.status(404).json({ message: 'User not found.' });
    // This is the key we send out:
    const userKey = randomstring.generate({
      charset: 'alphanumeric'
    });
    const hash = User.generateHash(userKey);
    // This is what we store in the db:
    console.log('-----------REQUESTING KEY ------------------');
    console.log('userKey', userKey);
    console.log('hash', hash);
    console.log('-----------REQUESTING KEY ------------------');


    const newPasswordReset = new PasswordReset();
    newPasswordReset.userId = user._id;
    newPasswordReset.hash = hash;
    newPasswordReset.email = email;

    return newPasswordReset.save()
    .then((resetPass) => {
      // TODO: throttle how many emails we send to same email per time.
      const msg = {
        to: email,
        from: 'jason@softwaredaily.com',
        subject: 'Password reset email',
        text: `Reset your password here ${config.baseUrl}/#/regain-account/${userKey}/${user._id}`,
        html: `<strong> <a href="${config.baseUrl}/#/regain-account/${userKey}/${user._id}"> Click here </a> to reset your password. `,
      };
      // TODO: is this async?
      sgMail.send(msg);
      res.json({});
    })
  })
  .catch((err) => {
    console.log('user not found------------------', email);
    console.log('user not found------------------error', err);
    err = new APIError('User not found error', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
    return next(err);
  });
}

/**
 * @swagger
 * /users/me/bookmarked:
 *   get:
 *     summary: Get bookmarked for current user
 *     description: Get list of bookmarked posts for the authenticated user.
 *     tags: [user]
 *     security:
 *       - Token: []
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Post'
 *
 * /users/{userId}/bookmarked:
 *   get:
 *     summary: Get bookmarked for specific user
 *     description: Get list of bookmarked posts for a specified user by userId.
 *     tags: [user]
 *     parameters:
 *       - $ref: '#/parameters/userId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Post'
 */

function listBookmarked(req, res, next) {
  // either from loaded user if passed as path param specified or authenticated user
  const userId = req.userLoaded ? req.userLoaded._id : req.user._id;

  return Favorite.listBookmarkedPostsForUser(userId)
    .then((bookmarked) => {
      res.json(bookmarked);
    }).catch((e) => {
      next(e);
    });
}

export default {
  load, get, me, update, listBookmarked, requestPasswordReset, regainPassword
};
