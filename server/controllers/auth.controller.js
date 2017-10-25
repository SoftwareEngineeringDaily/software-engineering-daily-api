import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/config';
import passport from 'passport';
import FacebookTokenStrategy from 'passport-facebook-token';
import User from '../models/user.model';
import _ from 'lodash';

passport.serializeUser(function(user, done){
  done(null, user._id);
});

passport.deserializeUser(function(id, done){
  User.findOne(id, function(err, user){
    done(err, user);
  });
});

passport.use(new FacebookTokenStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret
  },
  function(accessToken, refreshToken, profile, done) {
    let username = profile.emails[0].value || profile.id;
    User
    .findOne({ username: username }).exec()
    .then((user) => {
      if (!user) {
        const newUser = new User();
        newUser.username = username;
        newUser.facebook = {
          'email': profile.emails[0].value,
          'name': profile.name.givenName + ' ' + profile.name.familyName,
          'id': profile.id,
          'token': accessToken
        };
        return newUser.save()
          .then(userSaved => {
            return done(null, userSaved);
          })
      } else {
        return done(null, user);
      }
    })
    .catch((err) => {
      err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
      return done(err);
    });
  }
));

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

  if (!username) {
    let err = new APIError('Username is required to register.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
    return next(err);
  }

  if (!password) {
    let err = new APIError('Password is required to register.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
    return next(err);
  }

  User
    .findOne({ username }).exec()
    .then((user) => {
      if (user) {
        let err = new APIError('User already exists.', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
        return next(err);
      }

      const newUser = new User();
      newUser.password = User.generateHash(password);
      // We assing a set of "approved fields"
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

export default { login, getRandomNumber, register, socialAuth };
