import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Listened Schema
 * @property {String} userId - The id of the user.
 * @property {ObjectId} postId - The id of the post.
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

  /**
   * List listened items by User in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of favorites to be skipped.
   * @param {number} limit - Limit number of favorites to be returned.
   * @param {number} userId - The post ID.
   * @returns {Promise<ListenedSchema[]>}
   */
  listByUser({ skip = 0, limit = 50 } = {}, userId) {
    return this.find({ userId })
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef ListenedSchema
 */
export default mongoose.model('Listened', ListenedSchema);
