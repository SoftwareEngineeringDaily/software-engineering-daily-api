import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import ctrl from '../controllers/post.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(ctrl.list);

router.route('/:postId')
  .get(ctrl.get);

router.route('/:postId/upvote')
  .post(ctrl.like);

router.param('postId', ctrl.load);

export default router;
