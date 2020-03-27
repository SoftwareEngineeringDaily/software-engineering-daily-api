import express from 'express';
import expressJwt from 'express-jwt';
import topicCtrl from '../controllers/topic.controller';
import topicPageCtrl from '../controllers/topicPage.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/:topicId([0-9a-f]{24})') // possible conflict with slug route
  .get(expressJwt({ secret: config.jwtSecret }), topicCtrl.get)
  .put(expressJwt({ secret: config.jwtSecret }), topicCtrl.update);

router.route('/')
  .get(expressJwt({ secret: config.jwtSecret }), topicCtrl.getFull)
  .post(expressJwt({ secret: config.jwtSecret }), topicCtrl.add);

router.route('/:slug')
  .get(topicPageCtrl.showContent);

router.route('/:slug/episodes')
  .get(topicCtrl.episodes);

export default router;
