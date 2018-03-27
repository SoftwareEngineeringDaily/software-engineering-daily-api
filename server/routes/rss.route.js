import express from 'express';
import expressJwt from 'express-jwt';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import rssCtrl from '../controllers/rss.controller';
import config from '../../config/config';
import loadFullUser from '../middleware/loadFullUser.middleware';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false })
    , loadFullUser
    , rssCtrl.list
  );

// router.param('postId', postCtrl.load);

export default router;
