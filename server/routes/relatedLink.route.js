import express from 'express';
import expressJwt from 'express-jwt';
import transferField from '../middleware/transferField';
import relatedLinkCtrl from '../controllers/relatedLink.controller';
import voteCtrl from '../controllers/vote.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap


router.route('/:relatedLinkId')
  .delete(
    expressJwt({ secret: config.jwtSecret }),
    relatedLinkCtrl.remove
  );

router.route('/:relatedLinkId/upvote')
  .post(expressJwt({ secret: config.jwtSecret })
  // TODO: refactor to have these into one call like upvote: [method1, method2,...]
  // upvoteHandlers
  , transferField({source: 'relatedLink', target: 'entity'})
  , voteCtrl.findVote
  , voteCtrl.upvote // rename to upvoteHelper
  , voteCtrl.finish // IF we add a model.unlike we don't really need this..
);

router.route('/:relatedLinkId/downvote')
  .post(expressJwt({ secret: config.jwtSecret })
  , transferField({source: 'relatedLink', target: 'entity'})
  , voteCtrl.findVote
  , voteCtrl.downvote
  , voteCtrl.finish
);

router.param('relatedLinkId', relatedLinkCtrl.load);

export default router;
