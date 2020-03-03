import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/config';

/**
 * @swagger
 * definitions:
 *  Like:
 *    type: object
 *    properties:
 *      _id:
 *        $ref '#/definitions/ObjectId'
 *      __v:
 *        $ref: '#/definitions/MongoVersion'
 *      userId:
 *        $ref '#/definitions/ObjectId'
 *      postId:
 *        $ref '#/definitions/ObjectId'
 *      dateCreated:
 *        type: string
 *        format: date-time
 *        description: Date comment created
 *        example: 2017-10-30T01:05:39.674Z
 */
const LikeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
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
LikeSchema.method({});

/**
 * Statics
 */
LikeSchema.statics = {

  /**
   * Get like
   * @param {ObjectId} id - The objectId of like.
   * @returns {Promise<Like, APIError>}
   */
  get(id, userId) {
    return this.findOne({ _id: id, userId })
      .exec()
      .then((like) => {
        if (like) {
          return like;
        }
        const err = new APIError('No such like exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List likes in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of likes to be skipped.
   * @param {number} limit - Limit number of likes to be returned.
   * @returns {Promise<Like[]>}
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
 * @typedef Like
 */
export default mongoose.model(`${config.mongo.collectionPrefix}Like`, LikeSchema);
