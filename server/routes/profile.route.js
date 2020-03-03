import express from 'express';
import profileCtrl from '../controllers/profile.controller';

const router = express.Router();

router.route('/:profileId').get(profileCtrl.getPublic);

router.route('/activities/:userId').get(profileCtrl.getActivities);

export default router;
