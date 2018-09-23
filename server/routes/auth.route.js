import passport from 'passport';
import express from 'express';
import validate from 'express-validation';
import expressJwt from 'express-jwt';
import paramValidation from '../../config/param-validation';
import authCtrl from '../controllers/auth.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

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

router.route('/facebook/token').post(passport.authenticate('facebook-token'), authCtrl.socialAuth);

router.route('/recaptcha').post(authCtrl.validateRecaptcha);

export default router;
