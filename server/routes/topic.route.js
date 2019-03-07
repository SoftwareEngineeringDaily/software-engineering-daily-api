import express from 'express';
import expressJwt from 'express-jwt';
import topicCtrl from '../controllers/topic.controller';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(expressJwt({ secret: config.jwtSecret }), topicCtrl.index)
  .post(topicCtrl.create);

router.route('/:id')
  .get(expressJwt({ secret: config.jwtSecret }), topicCtrl.show)
  .put(expressJwt({ secret: config.jwtSecret }), topicCtrl.update)
  .delete(expressJwt({ secret: config.jwtSecret }), topicCtrl.deleteTopic);

router.route('/addTopicToUser')
  .post(expressJwt({ secret: config.jwtSecret }), topicCtrl.addTopicToUser);

router.route('/addTopicsToPost')
  .post(expressJwt({ secret: config.jwtSecret }), topicCtrl.addTopicsToPost);

export default router;
