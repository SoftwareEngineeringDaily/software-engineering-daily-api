
import express from 'express';
import expressJwt from 'express-jwt';
import ctrl from '../controllers/vote.controller';
import config from '../../config/config';
import feedCtrl from '../controllers/feed.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(
    expressJwt({ secret: config.jwtSecret })
    feedCtrl.list
  );

export default router;
