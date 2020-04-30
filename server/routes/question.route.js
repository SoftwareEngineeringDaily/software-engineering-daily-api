import express from 'express';
import expressJwt from 'express-jwt';
import questionCtrl from '../controllers/question.controller';
import loadFullUser from '../middleware/loadFullUser.middleware';
import ensureIsAdmin from '../middleware/ensureIsAdmin.middleware';
import config from '../../config/config';

const router = express.Router();
const jwt = expressJwt({ secret: config.jwtSecret });

router.route('/')
// .get(jwt, questionCtrl.search) // if needed in admin
  .post(jwt, loadFullUser, ensureIsAdmin, questionCtrl.create);

router.route('/:id')
  .get(questionCtrl.get)
  .put(jwt, loadFullUser, ensureIsAdmin, questionCtrl.update)
  .delete(jwt, loadFullUser, ensureIsAdmin, questionCtrl.delete);

router.route('/entity/:entityType/:entityId')
  .get(questionCtrl.getByEntity);

export default router;
