import mongoose, { Schema } from 'mongoose';
import httpStatus from 'http-status';
import moment from 'moment';
import voteModel from './vote.model';
import Comment from './comment.model';
import APIError from '../helpers/APIError';

const ThreadSchema = new Schema({
  title: {
    rendered: {
      type: String,
      required: true
    }
  },
  content: {
    rendered: {
      type: String,
      required: true
    }
  },
  createdAt: { type: Date, default: Date.now, required: true },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

/**
 * Methods
 */
ThreadSchema.methods = {
  /**
   * Return isUpVote bool if user is logined
   * @param {User} - The authorized user
   * @returns isUpVote bool
   */
  isUpVote(authUser) {
    if (!authUser) return false;
    return voteModel
      .findOne({
        entity: this._id,
        author: authUser._id,
        direction: 'upvote',
        active: true
      })
      .then((err, vote) => {
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
    return voteModel
      .findOne({
        entity: this._id,
        author: authUser._id,
        direction: 'downvote',
        active: true
      })
      .then((err, vote) => {
        if (!err && vote) return true;
        return false;
      });
  },
  /**
   * Return score of thread (count of upvote)
   * @returns {int} score - The score of thread
   */
  score() {
    return voteModel
      .find({
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
ThreadSchema.statics = {
  /**
   * Get thread
   * @param {ObjectId} id - The objectId of thread
   * @returns {Promise<Thread, APIError}
   */
  get(id, authUser) {
    return this.findById(id)
      .populate('author', '-email -password -__v -verified')
      .exec()
      .then((thread) => {
        if (thread) {
          const recursive = [
            thread.score().then(score => score),
            thread.isUpVote(authUser).then(isUpVote => isUpVote),
            thread.isDownVote(authUser).then(isDownVote => isDownVote),
            Comment.getFullList(id, authUser).then(comments => comments)
          ];
          return Promise.all(recursive).then(data => ({
            ...thread.toObject(),
            score: data[0],
            isUpVote: data[1],
            isDownVote: data[2],
            comments: data[3]
          }));
        }
        return Promise.reject(new APIError('No such thread exists!', httpStatus.NOT_FOUND));
      });
  },

  /**
   * List threads
   * @param {number} limit - Limit number of threds
   * @param {timestamp} createdAt - Date thread was created
   * @param {ObjectId} authUser - The authorized user
   * @param {string} sort - Sort option: asc | desc (default is desc)
   * @param {string} search - thread title to search
   * @returns {Promise<Thread[]>}
   */
  list({
    limit = 10,
    createdAt = null,
    authUser = null,
    sort = 'desc', // asc || desc
    search = null
  } = {}) {
    const query = {};
    let dateDirection = -1;
    if (createdAt) query.createdAt = { $lt: moment(createdAt).toDate() };
    if (sort === 'asc') {
      dateDirection = 1;
      if (createdAt) query.createdAt = { $gt: moment(createdAt).toDate() };
    }

    if (search) {
      const titleSearch = {};
      const searchWords = search.split(' ').join('|');
      titleSearch['title.rendered'] = {
        $regex: new RegExp(`${searchWords}`, 'i')
      };

      // @TODO: Add this when content doesn't have so much extra data
      // let contentSearch = {}
      // contentSearch['content.rendered'] = { $regex: new RegExp(`${search}`, 'i') };

      query.$or = [titleSearch];
    }
    const limitOption = parseInt(limit, 10);
    const orderBy = { createdAt: dateDirection };
    const queryPromise = this.find(query, 'title content author createdAt')
      .populate('author', '-email -password -__v -verified')
      .sort(orderBy)
      .limit(limitOption);

    if (dateDirection === 1) queryPromise.sort({ createdAt: -1 });

    const threadsWithVotes = queryPromise.then(threads =>
      Promise.all(threads.map((thread) => {
        const recursive = [
          thread.score().then(score => score),
          thread.isUpVote(authUser).then(isUpVote => isUpVote),
          thread.isDownVote(authUser).then(isDownVote => isDownVote)
        ];
        return Promise.all(recursive).then(data => ({
          ...thread.toObject(),
          score: data[0],
          isUpVote: data[1],
          isDownVote: data[2]
        }));
      })));

    return threadsWithVotes;
  }
};

ThreadSchema.index({ 'title.rendered': 'text', 'content.rendered': 'text' });

export default mongoose.model('Thread', ThreadSchema);
