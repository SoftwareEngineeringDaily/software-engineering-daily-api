import APIError from '../helpers/APIError';
import httpStatus from 'http-status';
import randomstring from "randomstring";
// TODO: validate this key and pull from config:
// var sendgrid = require('sendgrid')(process.env.SEND_GRID_KEY);
import _ from 'lodash';
import User from '../models/user.model';
import ResetPassword from '../models/resetPassword.model';
const sgMail = require('@sendgrid/mail');
//TODO: move this out of here:
sgMail.setApiKey(process.env.SEND_GRID_KEY);

/**
 * Load user and append to req.
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
    .catch(e => {
      return next(err);
    });
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
  if(!req.user || user._id != req.user._id) {
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
    return user.save().then(() => {
      res.json({...user, password: null});
    })
  })
  .catch(e => {
    console.log('error saving user', e);
    next(e)
  });
}

function requestResetPassword(req, res, next) {
  const { email }  = req;
  User.findOne({ $or: [
    {username: email},
    {email}
  ]}).exec()
  .then( (user) => {
    if (!user) return res.status(404).json({ message: 'User not found.' });
    // This is the key we send out:
    const userKey = randomstring.generate();
    // This is what we store in the db:
    const hash = User.generateHash(userKey);

    const newResetPassword = new ResetPassword();
    newResetPassword.userId = user._id;
    newResetPassword.hash = hash;

    newRestPassword.save()
    .then((resetPass) => {
      // TODO: throttle how many emails we send to same email per time.
      const msg = {
        to: email,
        from: 'jason@softwaredaily.com',
        subject: 'Password reset email',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong> <a href="http://www.softwaredaily.com/regain-account/' + userKey + '"> Click Here </a> some link kand easy to do anywhere, even with Node.js</strong>',
      };
      // TODO: is this async?
      sgMail.send(msg);
      res.json({});
    })
    .catch((error) => {
    });
  })
  .catch((err) => {
    err = new APIError('User not found error', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
    return next(err);
  });


}

export default { load, get, me, update, requestResetPassword
