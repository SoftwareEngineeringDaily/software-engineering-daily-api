import express from 'express';
import expressJwt from 'express-jwt';
import postCtrl from '../controllers/post.controller';
import favoriteCtrl from '../controllers/favorite.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(expressJwt({ secret: config.jwtSecret, credentialsRequired: false }), postCtrl.list);

router.route('/recommendations')
  .get(expressJwt({ secret: config.jwtSecret }), postCtrl.recommendations);

router.route('/:postId')
  .get(postCtrl.get);

router.route('/:postId/upvote')
  .post(expressJwt({ secret: config.jwtSecret }), postCtrl.upvote);

router.route('/:postId/downvote')
  .post(expressJwt({ secret: config.jwtSecret }), postCtrl.downvote);

router.route('/:postId/favorite')
  .post(expressJwt({ secret: config.jwtSecret }), favoriteCtrl.favorite);

router.route('/:postId/unfavorite')
  .post(expressJwt({ secret: config.jwtSecret }), favoriteCtrl.unfavorite);

router.param('postId', postCtrl.load);

export default router;
