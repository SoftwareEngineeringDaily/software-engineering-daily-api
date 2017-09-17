import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Vote Schema
 * @property {String} userId - The id of the user.
 * @property {ObjectId} postId - The id of the post.
 * @property {Boolean} active - Whether or not the vote is in an upvoted or downvoted state.
 * @property {String} direction - The direction of the vote: upvote or downvote.
 */
const VoteSchema = new mongoose.Schema({
  userId: String,
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  active: { type: Boolean, default: true },
  direction: String,
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
VoteSchema.method({
});

/**
 * Statics
 */
VoteSchema.statics = {
  /**
   * Get vote
   * @param {ObjectId} id - The objectId of vote.
   * @returns {Promise<Vote, APIError>}
   */
  get(id, userId) {
    return this.findOne({ id, userId })
      .exec()
      .then((vote) => {
        if (vote) {
          return vote;
        }
        const err = new APIError('No such vote exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List votes in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of votes to be skipped.
   * @param {number} limit - Limit number of votes to be returned.
   * @returns {Promise<Vote[]>}
   */
  list({ skip = 0, limit = 50 } = {}, userId) {
    return this.find({ userId })
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef Vote
 */
export default mongoose.model('Vote', VoteSchema);
