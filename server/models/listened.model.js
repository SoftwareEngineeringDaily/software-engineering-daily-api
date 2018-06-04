import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Vote from './vote.model';

/**
 * @swagger
 * definitions:
 *   Listened:
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
 *         description: Active state of favorite
 *
 */

const ListenedSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  },
  {
    timestamps: true
  }
);

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
ListenedSchema.method({
});

/**
 * Statics
 */
ListenedSchema.statics = {
  /**
   * Get listened post.
   * @param {ObjectId} id - The objectId of listened.
   * @param {ObjectId} userId - The user ID.
   * @returns {Promise<ListenedSchema, APIError>}
   */
  get(id, userId) {
    return this.findOne({ _id: id, userId })
      .exec()
      .then((listened) => {
        if (listened) {
          return listened;
        }
        const err = new APIError('No such item exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List listened items by Post in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of favorites to be skipped.
   * @param {number} limit - Limit number of favorites to be returned.
   * @param {number} postId - The post ID.
   * @returns {Promise<ListenedSchema[]>}
   */
  listByPost({ skip = 0, limit = 50 } = {}, postId) {
    return this.find({ postId })
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  },

  // TODO: move to a third party library and refactor post.model.js to also
  // use this in place of addVotesForUserToPosts;
  getUserVoteInfoForPosts(posts, userId) {
    const postIds = posts.map((post) => { //eslint-disable-line
      return post._id;
    });
    return Vote.find({
      $or: [
        {
          userId,
          postId: { $in: postIds },
        }, {
          userId,
          entityId: { $in: postIds },
        },
      ]
    })
      .exec()
      .then((votes) => {
        const voteMap = {};
        for (let index in votes) { // eslint-disable-line
          const vote = votes[index];
          const voteKey = vote.postId ? vote.postId : vote.entityId;
          voteMap[voteKey] = vote;
        }

        const updatedPosts = [];
        for (let index in posts) { // eslint-disable-line
          const post = {};
          post.upvoted = false;
          post.downvoted = false;

          if (!voteMap[post._id]) {
            updatedPosts.push(post);
            continue; // eslint-disable-line
          }

          if (voteMap[post._id].direction === 'upvote' && voteMap[post._id].active) {
            post.upvoted = true;
          }

          if (voteMap[post._id].direction === 'downvote' && voteMap[post._id].active) {
            post.downvoted = true;
          }

          updatedPosts.push(post);
        }

        return updatedPosts;
      });
  },

  /**
   * List listened items by User in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of favorites to be skipped.
   * @param {number} limit - Limit number of favorites to be returned.
   * @param {number} userId - The post ID.
   * @returns {Promise<ListenedSchema[]>}
   */

  listByUser({ skip = 0, limit = 50 } = {}, userId) {
    return this.find({ userId })
      .populate('postId')
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec()
      .then((listens) => {
        /* eslint-disable no-param-reassign */
        const posts = listens.map(listenEntry => listenEntry.postId);
        return this.getUserVoteInfoForPosts(posts, userId).then((postsVoteInfo) => {
          const newListens = [];
          for (let ii = 0; ii < listens.length; ii += 1) {
            const editableListen = listens[ii].toObject();
            editableListen.postId = { ...{}, ...editableListen.postId, ...postsVoteInfo[ii] };
            newListens.push(editableListen);
          }
          return newListens;
        });
      });
  }
};

export default mongoose.model('Listened', ListenedSchema);
