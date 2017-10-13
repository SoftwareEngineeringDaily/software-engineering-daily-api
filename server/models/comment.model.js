
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
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
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
   * @param {ObjectId} id - The objectId of the comment.
   * @returns {Promise<Comment, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((comment) => {
        if (comment) {
          return commment;
        }
        const err = new APIError('No such comment exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  getCommentsForItem(postId) {
    return this.find({})
    //return this.find({post: postId })
      .exec()
    }
};

// Indexes
//CommentSchema.index({ 'title.rendered': 'text', 'content.rendered': 'text' });

/**
 * @typedef Post
 */
export default mongoose.model('Post', PostSchema);
