import express from 'express';
import expressJwt from 'express-jwt';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import userCtrl from '../controllers/user.controller';
import loadFullUser from '../middleware/loadFullUser.middleware';
import ensureIsAdmin from '../middleware/ensureIsAdmin.middleware';
import ensureIsSuperAdmin from '../middleware/ensureIsSuperAdmin.middleware';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(
    expressJwt({ secret: config.jwtSecret }),
    loadFullUser,
    ensureIsAdmin,
    userCtrl.getAll
  );

// Admin CRUDE (don't interfere with profile update for now)
router.route('/admin/:userId')
  .put(
    expressJwt({ secret: config.jwtSecret }),
    loadFullUser,
    ensureIsSuperAdmin,
    userCtrl.update
  );

router.route('/me')
  /** GET /api/users/:userId - Get user */
  .get(
    expressJwt({ secret: config.jwtSecret }),
    userCtrl.me
  );

router.route('/search')
  .get(
    expressJwt({ secret: config.jwtSecret }),
    loadFullUser,
    userCtrl.list
  );

router.route('/search/names')
  .get(
    expressJwt({ secret: config.jwtSecret }),
    userCtrl.listNames
  );

router.route('/update-email-notiication-settings')
  .put(
    expressJwt({ secret: config.jwtSecret }),
    loadFullUser,
    validate(paramValidation.updateEmailNotiicationSettings),
    userCtrl.updateEmailNotiicationSettings
  );

router.route('/:userId')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false }),
    userCtrl.get
  )
  .put(
    expressJwt({ secret: config.jwtSecret }),
    validate(paramValidation.updateUser), userCtrl.updateProfile
  );

router.route('/:userId/topics')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false }),
    userCtrl.getTopics
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
  .get(
    expressJwt({ secret: config.jwtSecret }),
    userCtrl.listBookmarked
  );

router.route('/me/bookmarked/:postId')
  .delete(
    expressJwt({ secret: config.jwtSecret }),
    userCtrl.removeBookmarked
  );

router.route('/:userId/bookmarked')
  .get(userCtrl.listBookmarked);

/** Load user when API with userId route parameter is hit */
router.param('userId', userCtrl.load);

export default router;
