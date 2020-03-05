import express from 'express';
import expressJwt from 'express-jwt';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import postCtrl from '../controllers/post.controller';
import voteCtrl from '../controllers/vote.controller';
import likeCtrl from '../controllers/like.controller';
import transferField from '../middleware/transferField';
import relatedLinkCtrl from '../controllers/relatedLink.controller';
import bookmarkCtrl from '../controllers/bookmark.controller';
import listenedCtrl from '../controllers/listened.controller';
import config from '../../config/config';
import loadFullUser from '../middleware/loadFullUser.middleware';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(
    expressJwt({
      secret: config.jwtSecret,
      credentialsRequired: false,
    }),
    loadFullUser,
    postCtrl.list,
  );

router.route('/search')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false })
    , loadFullUser
    , postCtrl.search
  );

router.route('/recommendations')
  .get(
    expressJwt({ secret: config.jwtSecret })
    , loadFullUser
    , postCtrl.recommendations
  );

router.route('/:postId')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false })
    , loadFullUser
    , postCtrl.get
  );
// Get related links associated with postId
router.route('/:postId/related-links')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false })
    , relatedLinkCtrl.list
  );

// Add a related-link to postId:
router.route('/:postId/related-link')
  .post(
    expressJwt({ secret: config.jwtSecret })
    , validate(paramValidation.relatedLinkCreate)
    , relatedLinkCtrl.create
  );

router.route('/:postId/like')
  .post(
    expressJwt({ secret: config.jwtSecret }),
    likeCtrl.likePost,
  );

router.route('/:postId/upvote')
  .post(
    expressJwt({ secret: config.jwtSecret })
    , transferField({ source: 'post', target: 'entity' })
    , voteCtrl.findVote
    , voteCtrl.upvote // normal upvoting via vote model
    , postCtrl.upvote // special-case: uses racoon upvoting just for posts.
    , voteCtrl.finish
  );

router.route('/:postId/downvote')
  .post(
    expressJwt({ secret: config.jwtSecret })
    , transferField({ source: 'post', target: 'entity' })
    , voteCtrl.findVote
    , voteCtrl.downvote
    , postCtrl.downvote
    , voteCtrl.finish
  );

router.route('/:postId/bookmark')
  .post(
    expressJwt({ secret: config.jwtSecret }),
    bookmarkCtrl.bookmark,
  );

// todo: deprecate once all clients use bookmark
router.route('/:postId/favorite')
  .post(expressJwt({ secret: config.jwtSecret }), bookmarkCtrl.bookmark);

router.route('/:postId/unbookmark')
  .post(
    expressJwt({ secret: config.jwtSecret }),
    bookmarkCtrl.unbookmark,
  );

// todo: deprecate once all clients use unbookmark
router.route('/:postId/unfavorite')
  .post(
    expressJwt({ secret: config.jwtSecret }),
    bookmarkCtrl.unbookmark,
  );

router.route('/:postId/listened')
  .post(
    expressJwt({ secret: config.jwtSecret }),
    listenedCtrl.create,
  );

router.param('postId', postCtrl.load);

export default router;
