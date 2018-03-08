import express from 'express';
import expressJwt from 'express-jwt';
import forumCtrl from '../controllers/forum.controller';
import commentCtrl from '../controllers/comment.controller';
import transferField from '../middleware/transferField';
import config from '../../config/config';
import loadFullUser from '../middleware/loadFullUser.middleware';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false })
    , loadFullUser
    , forumCtrl.list
  );

router
  .route('/:forumThreadId')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false }),
    forumCtrl.detail
  )
  .put(expressJwt({ secret: config.jwtSecret, credentialsRequired: true }), forumCtrl.update)
  .delete(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true }),
    forumCtrl.delete
  );

router
  .route('/:forumThreadId/comment')
  .post(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true }),
    transferField({ source: 'forumThread', target: 'entity' }),
    commentCtrl.create
  );

router
  .route('/:forumThreadId/comments')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false }),
    transferField({ source: 'forumThread', target: 'entity' }),
    commentCtrl.list
  );

router.param('forumThreadId', forumCtrl.load);

export default router;
