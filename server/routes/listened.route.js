import express from 'express';
import expressJwt from 'express-jwt';
import ctrl from '../controllers/listened.controller';
import config from '../../config/config';
import loadFullUser from '../middleware/loadFullUser.middleware';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(expressJwt({ secret: config.jwtSecret }), ctrl.listByUser)
  .post(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true })
    , loadFullUser
    , ctrl.create
  );

router.route('/user/:userId')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false }),
    ctrl.listByUser
  );

export default router;
