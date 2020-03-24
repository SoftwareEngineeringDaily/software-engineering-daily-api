import express from 'express';
import expressJwt from 'express-jwt';
import validate from 'express-validation';
import topicCtrl from '../controllers/topic.controller';
import topicPageCtrl from '../controllers/topicPage.controller';
import relatedLinkCtrl from '../controllers/relatedLink.controller';
import paramValidation from '../../config/param-validation';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/:topicId([0-9a-f]{24})') // possible conflict with slug route
  .get(expressJwt({ secret: config.jwtSecret }), topicCtrl.get)
  .put(expressJwt({ secret: config.jwtSecret }), topicCtrl.update);

router.route('/')
  .get(expressJwt({ secret: config.jwtSecret }), topicCtrl.getFull)
  .post(expressJwt({ secret: config.jwtSecret }), topicCtrl.add);

router.route('/:slug')
  .get(topicPageCtrl.showContent);

router.route('/:slug/related-links')
  .get(topicPageCtrl.relatedLinks)
  .post(
    expressJwt({ secret: config.jwtSecret })
    , validate(paramValidation.relatedLinkCreate)
    , relatedLinkCtrl.create
  );

export default router;
