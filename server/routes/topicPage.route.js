import express from 'express';
import expressJwt from 'express-jwt';
import topicPageCtrl from '../controllers/topicPage.controller';
import topicPageRevisionCtrl from '../controllers/topicPageRevision.controller';
import config from '../../config/config';
import loadFullUser from '../middleware/loadFullUser.middleware';

const router = express.Router();
const auth = expressJwt({ secret: config.jwtSecret });

router.route('/recentPages')
  .get(topicPageCtrl.recentPages);

router.route('/:slug')
  .get(topicPageCtrl.showContent)
  .put(auth, loadFullUser, topicPageCtrl.update);

router.route('/:slug/publish')
  .put(auth, loadFullUser, topicPageCtrl.publish);

router.route('/:slug/unpublish')
  .put(auth, loadFullUser, topicPageCtrl.unpublish);

router.route('/:slug/edit')
  .get(auth, loadFullUser, topicPageCtrl.get);

router.route('/:slug/revision/:revisionNumber')
  .get(auth, loadFullUser, topicPageRevisionCtrl.get)
  .post(auth, loadFullUser, topicPageRevisionCtrl.set);

router.route('/:slug/images')
  .get(topicPageCtrl.getImages)
  .post(
    auth,
    loadFullUser,
    topicPageCtrl.signS3ImageUpload
  );

router.route('/:slug/logo')
  .post(
    auth,
    loadFullUser,
    topicPageCtrl.signS3LogoUpload
  );

router.route('/:slug/images/:imageId')
  .delete(auth, topicPageCtrl.deleteImage);
export default router;
