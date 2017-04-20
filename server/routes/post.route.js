import express from 'express';
import validate from 'express-validation';
import expressJwt from 'express-jwt';
import paramValidation from '../../config/param-validation';
import ctrl from '../controllers/post.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(ctrl.list);

  router.route('/recommendations')
    .get(expressJwt({ secret: config.jwtSecret }), ctrl.recommendations);

router.route('/:postId')
  .get(ctrl.get);

router.route('/:postId/upvote')
  .post(expressJwt({ secret: config.jwtSecret }), ctrl.upvote);

router.route('/:postId/downvote')
  .post(expressJwt({ secret: config.jwtSecret }), ctrl.downvote);

router.param('postId', ctrl.load);

export default router;
