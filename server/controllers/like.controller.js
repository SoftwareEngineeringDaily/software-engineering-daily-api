import algoliasearch from 'algoliasearch';
import Like from '../models/like.model';
import Post from '../models/post.model';

function syncAlgolia(query) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const client = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_API_KEY,
  );

  const index = client.initIndex(process.env.ALGOLIA_POSTS_INDEX);

  index.partialUpdateObject(query);
}

/**
 * @swagger
 * tags:
 * - name: like
 *   description: Manages liking of posts
 */

/**
 * @swagger
 * /posts/{postId}/like:
 *   active:
 *     summary: Uplike episode by ID
 *     description: Uplike episode by ID
 *     tags: [like]
 *     security:
 *       # indicates security authorization required
 *       # empty array because no "scopes" for non-OAuth
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Like'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */
async function likePost(req, res) {
  const { postId } = req.params;
  const { _id: userId } = req.user;
  const query = { postId, userId };
  const like = new Like(query);
  const likeActive = await Like.findOne(query);
  const likeCount = likeActive ? -1 : 1;

  if (likeActive) {
    await Like.deleteOne({ _id: likeActive._id });
  } else {
    await like.save();
  }

  Post
    .findOneAndUpdate(
      { _id: postId },
      { $inc: { likeCount } },
      { new: true },
    ).exec(async (err, reply) => {
      if (err) {
        return res.status(500).json({ message: 'Error liking post' });
      }

      syncAlgolia({
        likeCount: reply.likeCount,
        objectID: reply.id,
      });

      return res.json({
        likeCount: reply.likeCount,
        likeActive: !(likeActive),
      });
    });
}

export default {
  likePost,
};
