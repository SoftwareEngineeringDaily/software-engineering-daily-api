import express from 'express';
import expressJwt from 'express-jwt';
import topicCtrl from '../controllers/topic.controller';
import loadFullUser from '../middleware/loadFullUser.middleware';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

const auth = expressJwt({ secret: config.jwtSecret });

router.route('/mostPopular')
  .get(topicCtrl.mostPopular);

router.route('/mostPosts')
  .get(topicCtrl.mostPosts);

router.route('/addTopicsToPost')
  .post(topicCtrl.addTopicsToPost);

router.route('/')
  .get(topicCtrl.index)
  .post(auth, loadFullUser, topicCtrl.create);

router.route('/full')
  .get(topicCtrl.getFull);

router.route('/addTopicsToUser')
  .post(topicCtrl.addTopicsToUser);

router.route('/searchTopics')
  .get(topicCtrl.searchTopics);

router.route('/top/:count')
  .get(topicCtrl.top);

router.route('/maintainer')
  .post(auth, topicCtrl.setMaintainer);

router.route('/:slug')
  .get(topicCtrl.show)
  // .put(expressJwt({ secret: config.jwtSecret }), topicCtrl.update)
  .delete(auth, topicCtrl.deleteTopic);


export default router;
