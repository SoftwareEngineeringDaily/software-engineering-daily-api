
import express from 'express';
import expressJwt from 'express-jwt';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import subscriptionCtrl from '../controllers/subscription.controller';
import loadFullUser from '../middleware/loadFullUser.middleware';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .post(
    expressJwt({ secret: config.jwtSecret})
    , subscriptionCtrl.create
  )
  .delete(
    expressJwt({ secret: config.jwtSecret })
    , loadFullUser
    , subscriptionCtrl.cancel
  );


export default router;
