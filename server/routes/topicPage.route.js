import express from 'express';
import expressJwt from 'express-jwt';
import topicPageCtrl from '../controllers/topicPage.controller';
import config from '../../config/config';
import loadFullUser from '../middleware/loadFullUser.middleware';

const router = express.Router();
const jwt = expressJwt({ secret: config.jwtSecret });

router.route('/recentPages')
  .get(topicPageCtrl.recentPages);

router.route('/:slug')
  .get(topicPageCtrl.showContent)
  .put(jwt, topicPageCtrl.update);

router.route('/:slug/publish')
  .put(jwt, topicPageCtrl.publish);

router.route('/:slug/unpublish')
  .put(jwt, topicPageCtrl.unpublish);

router.route('/:slug/edit')
  .get(jwt, topicPageCtrl.get);

router.route('/:slug/images')
  .get(topicPageCtrl.getImages)
  .post(
    jwt,
    loadFullUser,
    topicPageCtrl.signS3ImageUpload
  );

router.route('/:slug/logo')
  .post(
    jwt,
    loadFullUser,
    topicPageCtrl.signS3LogoUpload
  );

router.route('/:slug/images/:imageId')
  .delete(jwt, topicPageCtrl.deleteImage);
export default router;
