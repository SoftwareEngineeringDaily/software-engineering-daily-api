import express from 'express';
import rssCtrl from '../controllers/rss.controller';

const router = express.Router();

router.route('/public/all').get(rssCtrl.publicFeed);

export default router;
