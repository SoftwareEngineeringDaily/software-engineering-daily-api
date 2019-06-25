import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Post from './post.model';
import config from '../../config/config';

/**
 * todo: once clients migrated "bookmark" - do final refactor of code and db migration
 */

/**
 * @swagger
 * definitions:
 *   Bookmark:
 *     type: object
 *     properties:
 *       _id:
 *         $ref: '#/definitions/ObjectId'
 *       __v:
 *         $ref: '#/definitions/MongoVersion'
 *       userId:
 *         $ref: '#/definitions/ObjectId'
 *       postId:
 *         $ref: '#/definitions/ObjectId'
 *       active:
 *         type: boolean
 *         description: Active state of bookmark
 *
 */

const FavoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  active: { type: Boolean, default: true }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
FavoriteSchema.method({
});

/**
 * Statics
 */
FavoriteSchema.statics = {
  /**
   * Get favorite.
   * @param {ObjectId} id - The objectId of favorite.
   * @returns {Promise<Favorite, APIError>}
   */
  get(id, userId) {
    return this.findOne({ _id: id, userId })
      .exec()
      .then((favorite) => {
        if (favorite) {
          return favorite;
        }
        const err = new APIError('No such bookmark exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List favorites in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of favorites to be skipped.
   * @param {number} limit - Limit number of favorites to be returned.
   * @returns {Promise<Favorite[]>}
   */
  list({ skip = 0, limit = 50 } = {}, userId) {
    return this.find({ userId })
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  },
  /**
   * List posts bookmarked by user
   * @param {ObjectId} userId - The objectId of user to find bookmarked posts for.
   @returns {Promise<Post[]>}
   */
  listBookmarkedPostsForUser(userId) {
    return this.find({ userId, active: true }, 'postId')
      .then((bookmarks) => {
      // return empty array if nothing yet bookmarked
        if (bookmarks.length === 0) {
          return [];
        }
        const postIds = bookmarks.map(bookmark => bookmark.postId);
        return Post.find({ _id: { $in: postIds } }, Post.standardSelectForFind)
          .populate('thread')
          .sort({ date: -1 })
          // .lean() // returns as plain object, but this will remove default values which is bad
          .exec();
      }).then((posts) => {
        const _posts = posts.map(post => post.toObject());
        const postsWithVotes = Post.addVotesForUserToPosts(_posts, userId);
        return postsWithVotes.map(post => Object.assign({}, post, { bookmarked: true }));
      });
  }
};

export default mongoose.model(`${config.mongo.collectionPrefix}Favorite`, FavoriteSchema);
