import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Like Schema
 */
const LikeSchema = new mongoose.Schema({
  userId: String,
  postId: String,
  type: String,
  active: {type: Boolean, default: true},
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
LikeSchema.method({
});

/**
 * Statics
 */
LikeSchema.statics = {
  /**
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<Like, APIError>}
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
   * @returns {Promise<Like[]>}
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
 * @typedef Like
 */
export default mongoose.model('Like', LikeSchema);
