import Promise from 'bluebird';
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
 *       post:
 *         $ref: '#/definitions/ObjectId'
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
  /*
  root: {
    type: Schema.Types.ObjectId
    // , ref: 'Post' | 'AMA'
  },
  */
  entity: {
    type: Schema.Types.ObjectId
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
 * Methods
 */
CommentSchema.methods = {
  /**
   * Return isUpVote bool if user is logined
   * @param {User} - The authorized user
   * @returns isUpVote bool
   */
  isUpVote(authUser) {
    if (!authUser) return false;
    return Vote.findOne({
      entity: this._id,
      author: authUser._id,
      direction: 'upvote',
      active: true
    }).then((err, vote) => {
      if (!err && vote) return true;
      return false;
    });
  },
  /**
   * Return isDownVote bool if user is logined
   * @param {User} - The authorized user
   * @returns isDownVote bool
   */
  isDownVote(authUser) {
    if (!authUser) return false;
    return Vote.findOne({
      entity: this._id,
      author: authUser._id,
      direction: 'downvote',
      active: true
    }).then((err, vote) => {
      if (!err && vote) return true;
      return false;
    });
  },
  /**
   * Return score of comment (count of upvote)
   * @returns {int} score - The score of comment
   */
  score() {
    return Vote.find({
      entityId: this._id,
      active: true,
      direction: 'upvote'
    })
      .then(votes => votes.length)
      .catch(() => 0);
  }
};
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
  get(id, authUser = null) {
    return this.findById(id)
      .populate('author', '-password')
      .populate('post')
      .exec()
      .then((comment) => {
        if (comment) {
          const recursive = [
            comment.score().then(score => score),
            comment.isUpVote(authUser).then(isUpVote => isUpVote),
            comment.isDownVote(authUser).then(isDownVote => isDownVote)
          ];
          return Promise.all(recursive).then(data => ({
            ...comment.toObject(),
            score: data[0],
            isUpVote: data[1],
            isDownVote: data[2]
          }));
        }
        const err = new APIError('No such comment exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  getTopLevelComments(entityId, authUser = null) {
    return this.find(
      {
        entity: entityId,
        parentComment: null
      },
      '-__v'
    )
      .sort({ dateCreated: -1 })
      .populate('author', '-password -__v -email')
      .then(comments =>
        Promise.all(comments.map((comment) => {
          const recursive = [
            comment.score().then(score => score),
            comment.isUpVote(authUser).then(isUpVote => isUpVote),
            comment.isDownVote(authUser).then(isDownVote => isDownVote)
          ];
          return Promise.all(recursive).then(data => ({
            ...comment.toObject(),
            score: data[0],
            isUpVote: data[1],
            isDownVote: data[2]
          }));
        })));
  },

  getReplies(commentId, authUser = null) {
    return this.find(
      {
        parentComment: commentId
      },
      '-__v'
    )
      .populate('author', '-password -__v -email')
      .then(replies =>
        Promise.all(replies.map((reply) => {
          const recursive = [
            reply.score().then(score => score),
            reply.isUpVote(authUser).then(isUpVote => isUpVote),
            reply.isDownVote(authUser).then(isDownVote => isDownVote)
          ];
          return Promise.all(recursive).then(data => ({
            ...reply.toObject(),
            score: data[0],
            isUpVote: data[1],
            isDownVote: data[2]
          }));
        })));
  },

  getFullList(entityId, authUser = null) {
    return this.getTopLevelComments(entityId, authUser).then(comments =>
      Promise.all(comments.map(comment =>
        this.getReplies(comment._id, authUser).then(replies => ({ ...comment, replies })))));
  }
};

// Indexes
CommentSchema.index({ content: 'text' });

export default mongoose.model('Comment', CommentSchema);
