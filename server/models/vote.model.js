import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/config';

/**
 * @swagger
 * definitions:
 *  Vote:
 *    type: object
 *    properties:
 *      _id:
 *        $ref '#/definitions/ObjectId'
 *      __v:
 *        $ref: '#/definitions/MongoVersion'
 *      direction:
 *        type: string
 *        enum: [upvote, downvote]
 *      userId:
 *        $ref '#/definitions/ObjectId'
 *      postId:
 *        $ref '#/definitions/ObjectId'
 *      active:
 *        type: boolean
 *        description: Indicates vote's up or downvoted state is active
 */

const VoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  active: { type: Boolean, default: true },
  direction: String
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
VoteSchema.method({});

/**
 * Statics
 */
VoteSchema.statics = {

  generateEntityVoteInfo(entityClean, vote) {
    const entity = entityClean;
    entity.upvoted = false;
    entity.downvoted = false;

    if (!vote) {
      return entity;
    }

    if (vote.direction === 'upvote' && vote.active) {
      entity.upvoted = true;
    }

    if (vote.direction === 'downvote' && vote.active) {
      entity.downvoted = true;
    }
    return entity;
  },
  updateEntity(entity, vote) {
    entity.upvoted = false; // eslint-disable-line
    entity.downvoted = false; // eslint-disable-line

    if (!vote) {
      return entity;
    }

    if (vote.direction === 'upvote' && vote.active) {
      entity.upvoted = true; // eslint-disable-line
    }

    if (vote.direction === 'downvote' && vote.active) {
      entity.downvoted = true; // eslint-disable-line
    }
    return entity;
  },
  /**
   * Get vote
   * @param {ObjectId} id - The objectId of vote.
   * @returns {Promise<Vote, APIError>}
   */
  get(id, userId) {
    return this.findOne({ _id: id, userId })
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
export default mongoose.model(`${config.mongo.collectionPrefix}Vote`, VoteSchema);
