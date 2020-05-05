import express from 'express';
import expressJwt from 'express-jwt';
import validate from 'express-validation';
import transferField from '../middleware/transferField';
import paramValidation from '../../config/param-validation';
import commentCtrl from '../controllers/comment.controller';
import voteCtrl from '../controllers/vote.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap


router.route('/forEntity/:entityId')
  .get(
    expressJwt({
      secret: config.jwtSecret,
      credentialsRequired: false
    }),
    commentCtrl.list
  )
  .post(
    expressJwt({ secret: config.jwtSecret }),
    validate(paramValidation.comment),
    commentCtrl.create
  );

router.route('/:commentId/upvote')
  .post(
    expressJwt({ secret: config.jwtSecret })
    // TODO: refactor to have these into one call like upvote: [method1, method2,...]
    // upvoteHandlers
    , transferField({ source: 'comment', target: 'entity' })
    , voteCtrl.findVote
    , voteCtrl.upvote // rename to upvoteHelper
    , voteCtrl.finish // IF we add a model.unlike we don't really need this..
  );

router.route('/:commentId')
  .put(
    expressJwt({ secret: config.jwtSecret })
    , validate(paramValidation.comment)
    , commentCtrl.update
  )
  .delete(
    expressJwt({ secret: config.jwtSecret }),
    commentCtrl.remove
  );

/*
router.route('/:commentId/downvote')
  .post(expressJwt({ secret: config.jwtSecret })
  , transferField({source: 'comment', target: 'entity'})
  , voteCtrl.findVote
  , voteCtrl.downvote
  , voteCtrl.finish
); */


// TODO: load comment
router.param('commentId', commentCtrl.load);

export default router;
