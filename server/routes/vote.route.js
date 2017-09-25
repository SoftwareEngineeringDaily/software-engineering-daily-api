import express from 'express';
import expressJwt from 'express-jwt';
import ctrl from '../controllers/vote.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.use(expressJwt({ secret: config.jwtSecret }));

router.route('/')
  .get(ctrl.list);

router.route('/:voteId')
  .get(ctrl.get);

router.param('voteId', ctrl.load);

export default router;
