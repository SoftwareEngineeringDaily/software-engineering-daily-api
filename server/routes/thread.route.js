import express from 'express';
import expressJwt from 'express-jwt';
import config from '../../config/config';
import threadController from '../controllers/thread.controller';
import commentController from '../controllers/comment.controller';

const router = express.Router();

router
  .route('/')
  .get(expressJwt({ secret: config.jwtSecret, credentialsRequired: false }), threadController.list)
  .post(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true }),
    threadController.create
  );

router
  .route('/:threadId')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false }),
    threadController.detail
  )
  .put(expressJwt({ secret: config.jwtSecret, credentialsRequired: true }), threadController.update)
  .delete(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true }),
    threadController.delete
  );

router
  .route('/:entityId/comment')
  .post(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true }),
    commentController.create
  );

router
  .route('/:entityId/comments')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false }),
    commentController.list
  );

export default router;
