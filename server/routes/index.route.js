import express from 'express';
import docRoutes from '../docs';
import postRoutes from './post.route';
import feedRoutes from './feed.route';
import commentRoutes from './comment.route';
import relatedLinkRoutes from './relatedLink.route';
import voteRoutes from './vote.route';
import favoriteRoutes from './favorite.route';
import authRoutes from './auth.route';
import userRoutes from './user.route';
import listenedRoutes from './listened.route';
import tagsRoutes from './tag.route';
// import userRoutes from './user.route';

const router = express.Router(); // eslint-disable-line new-cap

/**
 * @swagger
 * tags:
 * - name: general
 *   description: General/server-related
 */

/**
 * @swagger
 * /health-check:
 *   get:
 *     summary: Health check of server
 *     description: Confirm SED API server running and okay
 *     tags: [general]
 *     responses:
 *       200:
 *         description: successful operation
 */

router.get('/health-check', (req, res) =>
  res.send('OK'));

router.use('/docs', docRoutes);
router.use('/related-links', relatedLinkRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/votes', voteRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/listened', listenedRoutes);
router.use('/tags', tagsRoutes);
router.use('/users', userRoutes);
router.use('/feed', feedRoutes);


// mount auth routes at /auth
router.use('/auth', authRoutes);

export default router;
