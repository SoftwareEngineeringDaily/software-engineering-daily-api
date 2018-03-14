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
    expressJwt({ secret: config.jwtSecret })
    , validate(paramValidation.createSubscription)
    , subscriptionCtrl.create
  )
  .delete(
    expressJwt({ secret: config.jwtSecret })
    , loadFullUser
    , subscriptionCtrl.cancel
  );

router.route('/webhook')
  .post(subscriptionCtrl.subscriptionDeletedWebhook);


export default router;
