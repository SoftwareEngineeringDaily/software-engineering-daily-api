import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/config';
import User from '../models/user.model';

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function login(req, res, next) {
  const username = req.body.username;
  const password = req.body.password;

  User
    .findOne({ username }).exec()
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
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function register(req, res, next) {
  const username = req.body.username;
  const password = req.body.password;

  User
    .findOne({ username }).exec()
    .then((user) => {
      if (user) {
        let err = new APIError('User already exists.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
        return next(err);
      }

      const newUser = new User();
      newUser.username = username;
      newUser.password = newUser.generateHash(password);

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

function loadSocialNetwork(req, res, next) {
  req.socialNetwork = req.params.socialNetwork;
  switch (req.socialNetwork) {
    case 'facebook':
    case 'google':
      next();
      break;
    default:
      let error = new APIError('No such social auth exists!', httpStatus.NOT_FOUND, true); //eslint-disable-line
      next(error);
  }
}

function socialAuth(req, res, next) {
  return res.json(req.socialNetwork);
}

/**
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

export default { login, getRandomNumber, register, loadSocialNetwork, socialAuth };
