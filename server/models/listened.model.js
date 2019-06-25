import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/config';

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
      .exec();
  }
};

export default mongoose.model(`${config.mongo.collectionPrefix}Listened`, ListenedSchema);
