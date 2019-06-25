import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/config';

/**
 * TODO: Add swagger doc
 * Tag Schema
 */
const TagSchema = new mongoose.Schema({
  id: Number,
  count: Number,
  description: String,
  link: String,
  name: String,
  slug: String,
  taxonomy: String,
  meta: Array,
  _links: Object
});

/**
 * Statics
 */
TagSchema.statics = {
  /**
   * Get tag
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<Tag, APIError>}
   */
  get(id) {
    return this.findOne({ id })
      .exec()
      .then((tag) => {
        if (tag) {
          return tag;
        }
        const err = new APIError('No such tag exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List tags
   * @param {number} skip - Number of tags to be skipped.
   * @param {number} limit - Limit number of tags to be returned.
   * @returns {Promise<Post[]>}
   */
  list({ skip = 0, limit = 50 } = {}) {
    return this.find({})
      .sort({ id: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef Tag
 */
export default mongoose.model(`${config.mongo.collectionPrefix}Tag`, TagSchema);
