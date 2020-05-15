import express from 'express';
import expressJwt from 'express-jwt';
import topicCtrl from '../controllers/topic.controller';
import topicPageCtrl from '../controllers/topicPage.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

const auth = expressJwt({ secret: config.jwtSecret });

router.route('/:topicId([0-9a-f]{24})') // possible conflict with slug route
  .get(topicCtrl.get)
  .put(auth, topicCtrl.update);

router.route('/')
  .get(auth, topicCtrl.getFull)
  .post(auth, topicCtrl.add);

router.route('/:slug')
  .get(topicPageCtrl.showContent);

router.route('/:slug/episodes')
  .get(topicCtrl.episodes)
  .post(auth, topicCtrl.createRelatedEpisode);

router.route('/:slug/jobs')
  .get(topicCtrl.jobs);

export default router;
