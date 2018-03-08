import express from 'express';
import expressJwt from 'express-jwt';
import config from '../../config/config';
import feedCtrl from '../controllers/feed.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/').get(
  expressJwt({
    secret: config.jwtSecret,
    credentialsRequired: false
  }),
  feedCtrl.list
);

router
  .route('/profile-feed/:userId')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false }),
    feedCtrl.listProfileFeed
  );

export default router;
