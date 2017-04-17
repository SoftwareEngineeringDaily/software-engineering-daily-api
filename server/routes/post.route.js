import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import ctrl from '../controllers/post.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  /** GET /api/posts - Get list of posts */
  .get(ctrl.list)

  /** POST /api/posts - Create new user */
  .post(validate(paramValidation.createPost), ctrl.create);

router.route('/:postId')
  /** GET /api/posts/:postId - Get user */
  .get(ctrl.get)

  /** PUT /api/posts/:postId - Update user */
  // .put(validate(paramValidation.updatePost), ctrl.update)

  /** DELETE /api/posts/:postId - Delete user */
  // .delete(ctrl.remove);

router.route('/:postId/like')
  .post(ctrl.like);

/** Load user when API with postId route parameter is hit */
router.param('postId', ctrl.load);

export default router;
