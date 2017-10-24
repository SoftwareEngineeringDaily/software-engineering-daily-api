import express from 'express';
import expressJwt from 'express-jwt';
import tagCtrl from '../controllers/tag.controller';

import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /api/tags/ - Get list of tags */
router.route('/')
  .get(expressJwt({secret: config.jwtSecret, credentialsRequired: false}), tagCtrl.list);

/** GET /api/tags/:tagId - Get tag */
router.route('/:tagId')
  .get(tagCtrl.get);

/** Load tag when API with tagId route parameter is hit */
router.param('tagId', tagCtrl.load);

export default router;
