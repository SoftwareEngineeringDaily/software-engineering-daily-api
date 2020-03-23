import algoliasearch from 'algoliasearch';
import Vote from '../models/vote.model';
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
  const query = {
    postId,
    userId,
    direction: 'upvote',
    active: true,
  };

  const like = new Vote(query);
  const likeActive = await Vote.findOne(query);
  const score = likeActive ? -1 : 1;

  if (likeActive) {
    await Vote.deleteOne({ _id: likeActive._id });
  } else {
    await like.save();
  }

  Post
    .findOneAndUpdate(
      { _id: postId },
      { $inc: { score } },
      { new: true },
    ).exec(async (err, reply) => {
      if (err) {
        return res.status(500).json({ message: 'Error liking post' });
      }

      syncAlgolia({
        score: reply.score,
        objectID: reply.id,
      });

      return res.json({
        score: reply.score,
        upvoted: !(likeActive),
      });
    });
}

export default {
  likePost,
};
