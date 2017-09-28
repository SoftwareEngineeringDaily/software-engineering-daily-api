import express from 'express';
import expressJwt from 'express-jwt';
import ctrl from '../controllers/listened.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.use(expressJwt({ secret: config.jwtSecret }));

router.route('/')
  .get(ctrl.list);

export default router;
