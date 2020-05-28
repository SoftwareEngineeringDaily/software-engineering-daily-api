import express from 'express';
import expressJwt from 'express-jwt';
import twitterCtrl from '../controllers/twitter.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/users/search')
  .get(
    expressJwt({ secret: config.jwtSecret }),
    twitterCtrl.usersSearch
  );

export default router;
