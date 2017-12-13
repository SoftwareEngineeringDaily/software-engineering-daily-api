import express from 'express';
import expressJwt from 'express-jwt';
import ctrl from '../controllers/bookmark.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.use(expressJwt({ secret: config.jwtSecret }));

router.route('/')
  .get(ctrl.list);

router.route('/:bookmarkId')
  .get(ctrl.get);

router.param('bookmarkId', ctrl.load);

export default router;
