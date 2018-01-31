import express from 'express';
import expressJwt from 'express-jwt';
import jobController from '../controllers/job.controller';
import loadFullUser from '../middleware/loadFullUser.middleware';
import config from '../../config/config';

const router = express.Router();

router.route('/')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false })
    , loadFullUser
    , jobController.list
  )
  .post(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true })
    , loadFullUser
    , jobController.create
  );

router.route('/:jobId')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false })
    , loadFullUser
    , jobController.get
  )
  .put(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true })
    , loadFullUser
    , jobController.update
  )
  .delete(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true })
    , loadFullUser
    , jobController.delete
  );

export default router;
