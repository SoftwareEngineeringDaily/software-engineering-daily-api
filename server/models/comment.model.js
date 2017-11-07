import Promise from 'bluebird';
import mongoose, {Schema} from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';


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
  score: { type: Number, default: 0 },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  deleted: {
    type: Boolean,
    default: false
  },
  lastEdited: {
    type: Date
  },
  /*
  root: {
    type: Schema.Types.ObjectId
    // , ref: 'Post' | 'AMA'
  },
  */
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});



/*
  upVotes: {
    type: Number,
    default: 0
  },
  downVotes: {
    type: Number,
    default: 0
  },
  voted: {
    // what user voted
  },
  replies: {
    type: Number,
    default: 0
  },

  // cummulative Votes
  // shadow banning--> not that usefull?
  //
  // last edited by
  // locked?
*/



/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */


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
          return comment;
        }
        const err = new APIError('No such comment exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  getTopLevelCommentsForItem(postId) {
    return this.find({post: postId, parentComment: null })
      .sort({dateCreated: -1})
      .populate('author', '-password')
  },

  // Gets children comments for parentComment and adds them as a
  // field called replies
  fillNestedComments(parentComment) {
    return this.getNestedComments(parentComment._id)
    .then( (replies) => {
      let comment = parentComment.toJSON();
      comment.replies = replies;
      return comment
    });
  },

 /**
  * Fetches children comments (one level deep) for the provided parentComment id
  * @param  {String}   parentComment the id of the parentComment
  * @return {Promise}
  */
  getNestedComments(parentCommentId) {
    return this.find({parentComment: parentCommentId})
    .populate('author', '-password')
    .lean() // so not Mongoose objects
  }
};

// Indexes
CommentSchema.index({ 'content': 'text' });

/**
 * @typedef Post
 */
export default mongoose.model('Comment', CommentSchema);
