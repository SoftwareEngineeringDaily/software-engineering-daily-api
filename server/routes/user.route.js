import express from 'express';
import expressJwt from 'express-jwt';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import userCtrl from '../controllers/user.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/me')
  /** GET /api/users/:userId - Get user */
  .get(
    expressJwt({ secret: config.jwtSecret})
    , userCtrl.me)

router.route('/:userId')
  /** GET /api/users/:userId - Get user */
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false })
    , userCtrl.get)

  /** PUT /api/users/:userId - Update user */
  .put(
    expressJwt({ secret: config.jwtSecret})
    ,validate(paramValidation.updateUser), userCtrl.update)

router.route('/reset-password')
  .post(userCtrl.resetPassword)

/** Load user when API with userId route parameter is hit */
router.param('userId', userCtrl.load);

export default router;
