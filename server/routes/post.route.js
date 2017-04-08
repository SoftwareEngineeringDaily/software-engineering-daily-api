import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import userCtrl from '../controllers/post.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  /** GET /api/posts - Get list of posts */
  .get(userCtrl.list)

  /** POST /api/posts - Create new user */
  .post(validate(paramValidation.createPost), userCtrl.create);

router.route('/:postId')
  /** GET /api/posts/:postId - Get user */
  .get(userCtrl.get)

  /** PUT /api/posts/:postId - Update user */
  // .put(validate(paramValidation.updatePost), userCtrl.update)

  /** DELETE /api/posts/:postId - Delete user */
  // .delete(userCtrl.remove);

/** Load user when API with postId route parameter is hit */
router.param('postId', userCtrl.load);

export default router;
