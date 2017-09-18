import express from 'express';
import expressJwt from 'express-jwt';
import ctrl from '../controllers/favorite.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(expressJwt({ secret: config.jwtSecret }), ctrl.list);

router.route('/:favoriteId')
  .get(expressJwt({ secret: config.jwtSecret }), ctrl.get);

router.param('favoriteId', ctrl.load);

export default router;