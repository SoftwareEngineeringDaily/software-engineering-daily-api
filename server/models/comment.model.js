
import Promise from 'bluebird';
import mongoose  from 'mongoose';
import moment from 'moment';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Vote from './vote.model';

// TODO
// import mongoose {Schema}  from 'mongoose';

//
/**
 * Comment Schema
 */
const CommentSchema = new mongoose.Schema({
  id: String,
  text: {
    type: String,
    required: true
  },
  dateCreated: {
    type: Date,
    deafult: Date.now
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
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
CommentSchema.method({
});

/**
 * Statics
 */
CommentSchema.statics = {
  /**
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<Post, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  }
};

// Indexes
//CommentSchema.index({ 'title.rendered': 'text', 'content.rendered': 'text' });

/**
 * @typedef Post
 */
export default mongoose.model('Post', PostSchema);
