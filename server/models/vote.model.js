import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Vote Schema
 */
const VoteSchema = new mongoose.Schema({
  userId: String,
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  active: {type: Boolean, default: true},
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
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<Vote, APIError>}
   */
  get(id, userId) {
    return this.findOne({id, userId})
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<Vote[]>}
   */
  list({ skip = 0, limit = 50 } = {}, userId) {
    return this.find({userId})
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
