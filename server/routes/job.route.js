import express from 'express';
import expressJwt from 'express-jwt';
import multer from 'multer';
import jobController from '../controllers/job.controller';
import loadFullUser from '../middleware/loadFullUser.middleware';
import config from '../../config/config';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false })
    , jobController.list
  )
  .post(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true })
    , jobController.create
  );

router.route('/:jobId')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false })
    , jobController.get
  )
  .put(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true })
    , jobController.update
  )
  .delete(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true })
    , jobController.delete
  );

router.route('/:jobId/apply')
  .post(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true })
    , loadFullUser
    , upload.single('resume')
    , jobController.apply
  );

export default router;
