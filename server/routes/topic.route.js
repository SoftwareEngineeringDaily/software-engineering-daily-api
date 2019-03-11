import express from 'express';
import expressJwt from 'express-jwt';
import topicCtrl from '../controllers/topic.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/mostPopular')
  .get(topicCtrl.mostPopular);

router.route('/addTopicsToPost')
  .post(expressJwt({ secret: config.jwtSecret }), topicCtrl.addTopicsToPost);

router.route('/')
  .get(topicCtrl.index)
  .post(expressJwt({ secret: config.jwtSecret }), topicCtrl.create);

router.route('/:id')
  .get(topicCtrl.show)
  .put(expressJwt({ secret: config.jwtSecret }), topicCtrl.update)
  .delete(expressJwt({ secret: config.jwtSecret }), topicCtrl.deleteTopic);

router.route('/addTopicsToUser')
  .post(topicCtrl.addTopicsToUser);

export default router;
