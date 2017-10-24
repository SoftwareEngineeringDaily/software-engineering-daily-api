import express from 'express';
import postRoutes from './post.route';
import voteRoutes from './vote.route';
import favoriteRoutes from './favorite.route';
import authRoutes from './auth.route';
import listenedRoutes from './listened.route';
import tagsRoutes from './tag.route';

// import userRoutes from './user.route';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK'));

router.use('/posts', postRoutes);
router.use('/votes', voteRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/listened', listenedRoutes);
router.use('/tags', tagsRoutes);

// mount user routes at /users
// router.use('/users', userRoutes);

// mount auth routes at /auth
router.use('/auth', authRoutes);

export default router;
