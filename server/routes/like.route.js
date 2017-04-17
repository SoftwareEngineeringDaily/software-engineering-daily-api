import express from 'express';
import validate from 'express-validation';
import expressJwt from 'express-jwt';
import paramValidation from '../../config/param-validation';
import ctrl from '../controllers/like.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  /** GET /api/likes - Get list of likes */
  .get(expressJwt({ secret: config.jwtSecret }), ctrl.list)

  /** POST /api/likes - Create new like */
  // .post(validate(paramValidation.createLike), ctrl.create);

router.route('/:likeId')
  /** GET /api/likes/:likeId - Get like */
  .get(expressJwt({ secret: config.jwtSecret }), ctrl.get)

  /** PUT /api/likes/:likeId - Update like */
  // .put(validate(paramValidation.updateLike), ctrl.update)

  /** DELETE /api/likes/:likeId - Delete like */
  // .delete(ctrl.remove);

/** Load like when API with likeId route parameter is hit */
router.param('likeId', ctrl.load);

export default router;
