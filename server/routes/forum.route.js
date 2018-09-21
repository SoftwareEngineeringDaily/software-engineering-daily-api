import express from 'express';
import expressJwt from 'express-jwt';
import forumCtrl from '../controllers/forum.controller';
import transferField from '../middleware/transferField';
import config from '../../config/config';
import loadFullUser from '../middleware/loadFullUser.middleware';
import validateRecaptcha from '../middleware/validateRecaptcha.middleware';
import voteCtrl from '../controllers/vote.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false })
    , loadFullUser
    , forumCtrl.list
  )
  .post(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true })
    , validateRecaptcha
    , loadFullUser
    , forumCtrl.create
  );

router
  .route('/:forumThreadId')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false }),
    forumCtrl.detail
  )
  .put(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true }),
    forumCtrl.update
  )
  .delete(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true }),
    forumCtrl.remove
  );

router.route('/:forumThreadId/upvote')
  .post(
    expressJwt({ secret: config.jwtSecret })
    // TODO: refactor to have these into one call like upvote: [method1, method2,...]
    // upvoteHandlers
    , transferField({ source: 'forumThread', target: 'entity' })
    , voteCtrl.findVote
    , voteCtrl.upvote // rename to upvoteHelper
    , voteCtrl.finish // IF we add a model.unlike we don't really need this..
  );
router.param('forumThreadId', forumCtrl.load);

export default router;
