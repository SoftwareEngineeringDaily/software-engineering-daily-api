import express from 'express';
import expressJwt from 'express-jwt';
import questionCtrl from '../controllers/question.controller';
import loadFullUser from '../middleware/loadFullUser.middleware';
import config from '../../config/config';

const router = express.Router();
const jwt = expressJwt({ secret: config.jwtSecret });

router.route('/')
// .get(jwt, questionCtrl.search) // if needed in admin
  .post(jwt, loadFullUser, questionCtrl.create);

router.route('/unanswered')
  .get(questionCtrl.getUnanswered);

router.route('/:id')
  .get(questionCtrl.get)
  .put(jwt, loadFullUser, questionCtrl.update)
  .delete(jwt, loadFullUser, questionCtrl.delete);

router.route('/entity/:entityType/:entityId')
  .get(questionCtrl.getByEntity);

export default router;
