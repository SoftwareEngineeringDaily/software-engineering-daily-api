import express from 'express';
import validate from 'express-validation';
import expressJwt from 'express-jwt';
import paramValidation from '../../config/param-validation';
import ctrl from '../controllers/vote.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(expressJwt({ secret: config.jwtSecret }), ctrl.list);

router.route('/:voteId')
  .get(expressJwt({ secret: config.jwtSecret }), ctrl.get);

router.param('voteId', ctrl.load);

export default router;
