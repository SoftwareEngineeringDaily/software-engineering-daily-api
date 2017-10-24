import User from '../models/user.model';

/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  console.log('id', id)
  User.get(id)
    .then((user) => {
      delete user.password;
      user.password = null;
      console.log('user load', user);
      req.user = user; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get user
 * @returns {User}
 */
function get(req, res) {
  console.log('user get', req.user);
  return res.json(req.user);
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
  const user = req.user;
  user.username = req.body.username;
  user.save()
    .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}

export default {load, get, update};
