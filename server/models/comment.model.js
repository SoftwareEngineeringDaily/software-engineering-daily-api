import Promise from 'bluebird';
import each from 'lodash/each';
import mongoose, { Schema } from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Vote from './vote.model';
/**
 * @swagger
 * definitions:
 *   Comment:
 *     type: object
 *     properties:
 *       _id:
 *         $ref: '#/definitions/ObjectId'
 *       __v:
 *         $ref: '#/definitions/MongoVersion'
 *       content:
 *         type: string
 *         description: Comment body
 *         example: I like this episode
 *       dateCreated:
 *         type: string
 *         format: date-time
 *         description: Date comment created
 *         example: 2017-10-30T01:05:39.674Z
 *       author:
 *         $ref: '#/definitions/ObjectId'
 *       rootEntity:
 *         $ref: '#/definitions/ObjectId'
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
  rootEntity: {
    type: Schema.Types.ObjectId // The entity that owns this comment
    // , ref: 'Post' | 'AMA'
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
   * TODO - remove? not in use
   * Get user
   * @param {ObjectId} id - The objectId of the comment.
   * @returns {Promise<Comment, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate('author', '-password')
      // .populate('rootEntity')
      .exec()
      .then((comment) => {
        if (comment) {
          return comment;
        }
        const err = new APIError('No such comment exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  updateVoteInfo(comment, vote) {
    comment.upvoted = false; // eslint-disable-line
    comment.downvoted = false; // eslint-disable-line
    if (!vote) {
      return comment;
    }

    if (vote.direction === 'upvote' && vote.active) {
      comment.upvoted = true; // eslint-disable-line
    }

    if (vote.direction === 'downvote' && vote.active) {
      comment.downvoted = true; // eslint-disable-line
    }
    return comment;
  },
  // Take all comments, including their children/replies
  // and fill in the vote information.
  // NOTE: this requires parentComments to not be a mongoose objects
  // but rather normal objects.j
  populateVoteInfo(parentComments, user) {
    const commentIds = this.getAllIds(parentComments);
    return Vote.find({
      userId: user._id,
      entityId: { $in: commentIds }
    })
      .exec()
      .then((votes) => {
        const voteMap = {};
        // Create a map of votes by entityId
        votes.forEach((vote) => {
          const voteKey = vote.entityId;
          voteMap[voteKey] = vote;
        });
        // Fill up the actual parent comments to contain
        // vote info.
        parentComments.forEach((parentComment) => {
          this.updateVoteInfo(parentComment, voteMap[parentComment._id]);
          const { replies } = parentComment;
          replies.forEach((comment) => {
            this.updateVoteInfo(comment, voteMap[comment._id]);
          });
        });
        return parentComments;
      });
  },
  // Gets all comment ids, for both children and parents:
  getAllIds(parentComments) {
    let commentIds = parentComments.map(comment => comment._id);
    // now the children:
    each(parentComments, (parent) => {
      commentIds = commentIds.concat(parent.replies.map(comment => comment._id));
    });
    return commentIds;
  },

  getTopLevelCommentsForItem(entityId) {
    return this.find({ rootEntity: entityId, parentComment: null })
      .sort({ dateCreated: -1 })
      .populate('author', '-password');
  },

  // Gets children comments for parentComment and adds them as a
  // field called replies
  fillNestedComments(parentComment) {
    return this.getNestedComments(parentComment._id).then((replies) => {
      const comment = parentComment.toJSON();
      comment.replies = replies;
      return comment;
    });
  },

  /**
   * Fetches children comments (one level deep) for the provided parentComment id
   * @param  {String}   parentComment the id of the parentComment
   * @return {Promise}
   */
  getNestedComments(parentCommentId) {
    return this.find({ parentComment: parentCommentId })
      .populate('author', '-password')
      .lean(); // so not Mongoose objects
  }
};

// Indexes
CommentSchema.index({ content: 'text' });

export default mongoose.model('Comment', CommentSchema);
