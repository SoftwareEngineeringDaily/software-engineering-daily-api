import express from 'express';
import userRoutes from './user.route';
import postRoutes from './post.route';
import voteRoutes from './vote.route';
import authRoutes from './auth.route';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

router.use('/posts', postRoutes);
router.use('/votes', voteRoutes);

// mount user routes at /users
// router.use('/users', userRoutes);

// mount auth routes at /auth
router.use('/auth', authRoutes);

export default router;
