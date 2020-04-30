import express from 'express';
import expressJwt from 'express-jwt';
import answerCtrl from '../controllers/answer.controller';
import config from '../../config/config';

const router = express.Router();
const jwt = expressJwt({ secret: config.jwtSecret });

router.route('/')
  .post(jwt, answerCtrl.create);

router.route('/:id')
  .get(answerCtrl.get)
  .put(jwt, answerCtrl.update)
  .delete(jwt, answerCtrl.delete);

router.route('/:id/vote')
  .post(jwt, answerCtrl.vote);

export default router;
