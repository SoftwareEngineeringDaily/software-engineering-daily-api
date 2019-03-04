import express from 'express';
// import expressJwt from 'express-jwt';
import topicCtrl from '../controllers/topic.controller';

const router = express.Router(); // eslint-disable-line new-cap

// router.route('/')
//   .get(
//     expressJwt({ secret: config.jwtSecret}), topicCtrl.index
//   )
//   .post(
//     expressJwt({ secret: config.jwtSecret}), topicCtrl.create
//   );

router.route('/')
  .get(topicCtrl.index)
  .post(topicCtrl.create);

router.route('/:id')
  .get(topicCtrl.show)
  .put(topicCtrl.update)
  .delete(topicCtrl.deleteTopic);

router.route('/addTopicToUser')
  .post(topicCtrl.addTopicToUser);

export default router;
