import passport from 'passport';
import express from 'express';
import request from 'request';
import validate from 'express-validation';
import expressJwt from 'express-jwt';
import paramValidation from '../../config/param-validation';
import authCtrl from '../controllers/auth.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

function linkedinToken(req, res, next) {
  const url = 'https://www.linkedin.com/oauth/v2/accessToken';

  request
    .post(url, {
      form: {
        code: req.body.code,
        client_id: config.linkedin.clientId,
        client_secret: config.linkedin.clientSecret,
        redirect_uri: req.body.redirectUri,
        grant_type: 'authorization_code'
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
    }, (err, response, body) => {
      try {
        if (!err && response.statusCode === 200) {
          const reply = JSON.parse(body);

          req.access_token = reply.access_token;
          req.expiration = reply.expires_in;

          return next();
        }

        return res.status(response.statusCode).json(err);
      } catch (e) {
        return res.status(500).json(err || e);
      }
    });
}

/** POST /api/auth/login - Returns token if correct username and password is provided */
router.route('/login').post(validate(paramValidation.login), authCtrl.login);

router
  .route('/loginWithEmail')
  .post(validate(paramValidation.loginWithEmail), authCtrl.loginWithEmail);

router.route('/register').post(validate(paramValidation.register), authCtrl.register);

router.route('/sign-s3').post(expressJwt({ secret: config.jwtSecret }), authCtrl.signS3);

router
  .route('/sign-s3')
  .post(expressJwt({ secret: config.jwtSecret }), authCtrl.signS3AvatarUpload);

/** GET /api/auth/random-number - Protected route,
 * needs token returned by the above as header. Authorization: Bearer {token} */
router
  .route('/random-number')
  .get(expressJwt({ secret: config.jwtSecret }), authCtrl.getRandomNumber);

router
  .route('/facebook/token')
  .post(passport.authenticate('facebook-token'), authCtrl.socialAuth);

router
  .route('/linkedin')
  .post(
    linkedinToken,
    authCtrl.registerLinkedIn,
    authCtrl.socialAuth
  );

router.route('/recaptcha').post(authCtrl.validateRecaptcha);

export default router;
