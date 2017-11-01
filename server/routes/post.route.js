import express from 'express';
import expressJwt from 'express-jwt';
import postCtrl from '../controllers/post.controller';
import voteCtrl from '../controllers/vote.controller';
import commentCtrl from '../controllers/comment.controller';
import favoriteCtrl from '../controllers/favorite.controller';
import listenedCtrl from '../controllers/listened.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(expressJwt({ secret: config.jwtSecret, credentialsRequired: false }), postCtrl.list);

router.route('/recommendations')
  .get(expressJwt({ secret: config.jwtSecret }), postCtrl.recommendations);

router.route('/:postId')
  .get(postCtrl.get);

router.route('/:postId/comments')
  .get(expressJwt({ secret: config.jwtSecret, credentialsRequired: false }), commentCtrl.list);

router.route('/:postId/comment')
  .post(
    expressJwt({ secret: config.jwtSecret })
    , commentCtrl.create);

router.route('/:postId/upvote')
  .post(expressJwt({ secret: config.jwtSecret }), voteCtrl.upvote);

router.route('/:postId/downvote')
  .post(expressJwt({ secret: config.jwtSecret }), voteCtrl.downvote);

router.route('/:postId/favorite')
  .post(expressJwt({ secret: config.jwtSecret }), favoriteCtrl.favorite);

router.route('/:postId/unfavorite')
  .post(expressJwt({ secret: config.jwtSecret }), favoriteCtrl.unfavorite);

router.route('/:postId/listened')
  .post(expressJwt({ secret: config.jwtSecret }), listenedCtrl.create);

router.param('postId', postCtrl.load);

export default router;
