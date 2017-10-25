
import Promise from 'bluebird';
import mongoose, {Schema} from 'mongoose';
import moment from 'moment';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Vote from './vote.model';


//
/**
 * Comment Schema
 */
const CommentSchema = new Schema({
  id: String,
  content: {
    type: String,
    required: true
  },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  author: {
    type: Schema.Types.ObjectId,
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
      .populate('author', '-password')
      .populate('post')
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
    return this.find({post: postId })
      .sort({dateCreated: -1})
      .populate('author', '-password')
      .exec()
    }
};

// Indexes
CommentSchema.index({ 'content': 'text' });

/**
 * @typedef Post
 */
export default mongoose.model('Comment', CommentSchema);
