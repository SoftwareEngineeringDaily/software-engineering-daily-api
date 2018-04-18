import express from 'express';
import expressJwt from 'express-jwt';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import userCtrl from '../controllers/user.controller';
import loadFullUser from '../middleware/loadFullUser.middleware';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/me')
  /** GET /api/users/:userId - Get user */
  .get(
    expressJwt({ secret: config.jwtSecret })
    , userCtrl.me
  );

router.route('/search')
  .get(
    expressJwt({ secret: config.jwtSecret })
    , loadFullUser
    , userCtrl.list
  );

router.route('/update-email-notiication-settings')
  .put(
    expressJwt({ secret: config.jwtSecret })
    , loadFullUser
    , validate(paramValidation.updateEmailNotiicationSettings)
    , userCtrl.updateEmailNotiicationSettings
  );

router.route('/:userId')
  /** GET /api/users/:userId - Get user */
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false })
    , userCtrl.get
  )

  /** PUT /api/users/:userId - Update user */
  .put(
    expressJwt({ secret: config.jwtSecret })
    , validate(paramValidation.updateUser), userCtrl.update
  );

router.route('/regain-password')
  .post(
    validate(paramValidation.regainPassword),
    userCtrl.regainPassword
  );

router.route('/request-password-reset')
  .post(
    validate(paramValidation.requestPasswordReset),
    userCtrl.requestPasswordReset
  );

router.route('/me/bookmarked')
/** GET /api/users/me/bookmarked - Get bookmarked items for current user */
  .get(
    expressJwt({ secret: config.jwtSecret })
    , userCtrl.listBookmarked
  );

router.route('/:userId/bookmarked')
/** GET /api/users/:userId/bookmarked - Get bookmarked items for specified user */
  .get(userCtrl.listBookmarked);

/** Load user when API with userId route parameter is hit */
router.param('userId', userCtrl.load);

export default router;
