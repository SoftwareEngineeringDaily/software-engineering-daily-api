// TODO: need to do comment vote routes here otherwise post will be
// preloaded
import express from 'express';
import expressJwt from 'express-jwt';
import voteCtrl from '../controllers/vote.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap


router.route('/:commentId/upvote')
  .post(expressJwt({ secret: config.jwtSecret })
  // , voteCtrl.movePostToEntity TODO: moveToEntity, higher order function
  // middleware:
  // transferField({source: 'comment', target: 'entity'})
  // TODO: refactor to have these into one call like upvote: [method1, method2,...]
  // upvoteHandlers
  , voteCtrl.findVote
  , voteCtrl.upvote // rename to upvoteHelper
  , voteCtrl.finish // IF we add a model.unlike we don't really need this..
);

// TODO: load comment
