import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * @swagger
 * definitions:
 *   Favorite:
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
   * TODO - remove? not in use
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
        const err = new APIError('No such favorite exists!', httpStatus.NOT_FOUND);
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
  }
};

export default mongoose.model('Favorite', FavoriteSchema);
