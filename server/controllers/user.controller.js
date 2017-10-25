import APIError from '../helpers/APIError';
import httpStatus from 'http-status';
import User from '../models/user.model';

/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  User.get(id)
    .then((user) => {
      user.password = null;
      req.userLoaded = user; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get user
 * @returns {User}
 */
function get(req, res) {
  return res.json(req.userLoaded);
}

// TODO: fix this, as this should throw an error if updating to an existing
// user.
/**
 * Update existing user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {User}
 */
function update(req, res, next) {
  // TODO: this is a bit weird since we are overriding the req.user
  // we should be checkint to make sure that jwt token value is not overwritten!
  // So we can make sure the user updating is the same as the owner :)
  //
  const user = req.userLoaded;
  const username = req.body.username;
  if(!req.user || user._id != req.user._id) {
    let err = new APIError('Not enough  permissions to modify that user.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
    return next(err);
  }
  User.findOne({ username })
  .exec()
  .then((_user) => {
    if (_user && _user.id != user.id) {
      let err = new APIError('User already exists.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
      return next(err);
    }
    // TODO: update other properties:
    user.username = req.body.username;
    user.save()
    res.json(user);
  })
  .catch(e => next(e));
  }

export default {load, get, update};
