
import Promise from 'bluebird';
import mongoose, {Schema} from 'mongoose-fill';
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
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

CommentSchema.fill('replies', function(callback){
  console.log('--- replies fille -- ');
  console.log('--- ------------------------ replies fille -- ');
  console.log('--- ------------------------ replies fille -- ');
  console.log('--- ------------------------ replies fille -- ');
    this.db.model('Comment')
        .find({parentComment: this.id})
        .select('content author')
        .order('-dateCreated')
        .exec(callback)
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
