import randomstring from 'randomstring';
import httpStatus from 'http-status';
import _ from 'lodash';
import APIError from '../helpers/APIError';
// TODO: validate this key and pull from config:
import Favorite from '../models/favorite.model';
import User from '../models/user.model';
import PasswordReset from '../models/passwordReset.model';
import config from '../../config/config';

const sgMail = require('@sendgrid/mail');
// TODO: move this out of here, probably in it's own file:
sgMail.setApiKey(config.sendGridKey);

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
      delete user.password; // eslint-disable-line
      // We probably should't do this, also don't think
      // it has any effect until we do toObject();
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
      user.password = null; // eslint-disable-line
      return res.json(user);
    })
    .catch(e => next(e));
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

/**
 * Update existing user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {User}
 */
// eslint-disable-next-line
function update(req, res, next) {
  const user = req.userLoaded;
  const { username } = req.body;
  const avatarWasSet = req.body.isAvatarSet;
  // We gotta check a few things:
  // First we make sure we are the actual user we are modifying.
  // eslint-disable-next-line
  if (!req.user || user._id != req.user._id) {
    const err = new APIError(
      'Not enough  permissions to modify that user.',
      httpStatus.UNAUTHORIZED,
      true
    ); //eslint-disable-line
    return next(err);
  }

  // Next we are making sure the username doens't already exist:
  User.findOne({ username })
    .exec()
    .then((_user) => {
      // eslint-disable-next-line
      if (_user && _user.id != user.id) {
        let err = new APIError('User already exists.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
        return next(err);
      }
      // Using _.pick to only get a few properties:
      // otherwise user can set themselves to verified, etc :)
      const newValues = _.pick(req.body, User.updatableFields);
      Object.assign(user, newValues);
      if (avatarWasSet) {
        const S3_BUCKET = config.aws.profilePicBucketName;
        user.avatarUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${user._id}`;
      }
      return user.save().then((newUser) => {
        const userMinusPassword = Object.assign({}, newUser, { password: null });
        res.json(userMinusPassword);
      });
    })
    .catch((e) => {
      console.log('error saving user', e); // eslint-disable-line
      next(e);
    });
}

function regainPassword(req, res, next) {
  const { secretKey, newPassword, resetUID } = req.body;
  const hash = User.generateHash(secretKey);
  PasswordReset.findOne({ _id: resetUID, deleted: false })
    .exec()
    .then((passwordReset) => {
      if (!passwordReset) {
        console.log('Invalid passwordReset', passwordReset); // eslint-disable-line
        throw 'Invalid reset password.'; // eslint-disable-line
      }

      if (!User.isValidHash({ hash, original: secretKey })) {
        console.log('---------Invalid hash-----------'); // eslint-disable-line
        throw 'Invalid reset password.'; // eslint-disable-line
      }

      // Check that dateCreated is within a certain time period:
      const date1 = new Date(passwordReset.dateCreated);
      const date2 = new Date(); // today
      const timeDiff = Math.abs(date2.getTime() - date1.getTime());
      const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      if (diffDays > 2) {
        console.log('Password reset link has expired!------'); // eslint-disable-line
        throw 'Invalid reset password, has expired.'; // eslint-disable-line
      }
      // This is a little ugly and nested:
      return User.findOne({ _id: passwordReset.userId })
        .exec()
        .then((existingUser) => {
          if (!existingUser) {
            throw 'Invalid reset password.'; // eslint-disable-line
          }
          existingUser.password = User.generateHash(newPassword); // eslint-disable-line
          return existingUser.save().then(() => {
            passwordReset.deleted = true; // eslint-disable-line
            return passwordReset.save().then(() => {
              // TODO: return jwt:
              res.json({ success: true });
            });
          });
        });
    })
    .catch((error) => {
      next(error);
    });
}

function requestPasswordReset(req, res, next) {
  const { email } = req.body;
  User.findOne({
    $or: [{ username: email }, { email }]
  })
    .exec()
    .then((user) => {
      if (!user) return res.status(404).json({ message: 'User not found.' });
      // This is the key we send out:
      const secretKey = randomstring.generate({
        charset: 'alphanumeric'
      });
      const hash = User.generateHash(secretKey);
      // This is what we store in the db:
      const newPasswordReset = new PasswordReset();
      newPasswordReset.userId = user._id;
      newPasswordReset.hash = hash;
      newPasswordReset.email = email;

      return newPasswordReset.save().then((resetPass) => {
        // TODO: throttle how many emails we send to same email per time.
        const msg = {
          to: email,
          from: config.email.fromAddress,
          subject: 'Password reset email',
          text: `Reset your password here ${config.baseUrl}/#/regain-account/${secretKey}/${
            resetPass._id
          }`,
          html: `<strong> <a href="${config.baseUrl}/#/regain-account/${secretKey}/${
            resetPass._id
          }"> Click here </a> to reset your password. `
        };
        // TODO: is this async?
        sgMail.send(msg);
        res.json({});
      });
    })
    .catch((err) => {
      err = new APIError('User not found error', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
      return next(err);
    });
}

async function list(req, res, next) {
  try {
    const { username, email, name } = req.query;

    const query = User.find();
    if (username) {
      query.where('username').regex(new RegExp(username, 'i'));
    }

    if (email) {
      query.where('email').regex(new RegExp(email, 'i'));
    }

    if (name) {
      query.where('name').regex(new RegExp(name, 'i'));
    }

    const users = await query
      .limit(100)
      .select('-password')
      .exec();

    return res.json(users);
  } catch (err) {
    return next(err);
  }
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
    })
    .catch((e) => {
      next(e);
    });
}

function updateEmailNotiicationSettings(req, res, next) {
  const user = req.fullUser;
  user.emailNotiicationSettings = req.body; // eslint-disable-line no-param-reassign
  user.save()
    .then(() => res.json({}))
    .catch(() => {
      const err = new APIError('Not able to update settings.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
      return next(err);
    });
}

export default {
  load,
  get,
  me,
  list,
  update,
  listBookmarked,
  requestPasswordReset,
  updateEmailNotiicationSettings,
  regainPassword
};
