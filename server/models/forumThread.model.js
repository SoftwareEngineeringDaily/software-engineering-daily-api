import mongoose from 'mongoose';
import map from 'lodash/map';
import each from 'lodash/each';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Comment from './comment.model';

const ForumThreadSchema = new mongoose.Schema({
  id: String,
  score: { type: Number, default: 0 },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  deleted: {
    type: Boolean,
    default: false
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  commentsCount: { type: Number, default: 0 },
  dateLastAcitiy: { type: Date, default: Date.now },
  dateCreated: { type: Date, default: Date.now }
});

ForumThreadSchema.statics = {
  /**
   * Get post
   * @param {ObjectId} id - The objectId of forum thread.
   * @returns {Promise<Thread, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate('author', '-password')
      .exec()
      .then((thread) => {
        if (thread) {
          return thread;
        }
        const err = new APIError('No such thread exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  increaseCommentCount(id) {
    return this.get(id).then((thread) => {
      const forumThread = thread;
      forumThread.commentCount += 1;
      forumThread.dateLastAcitiy = new Date();
      return forumThread.save();
    });
  },

  list() {
    const query = {};
    query.deleted = false;
    return this.find(query)
      .populate('author', '-password')
      .sort({ dateLastAcitiy: -1 })
      .exec()
      .then((threads) => {
        // Let's fill in the commentCount for each thread.
        // First we get the ids in an array:
        const threadIds = map(threads, (thread) => {
          // Get Thread ids
          console.log('thread');
          return thread._id;
        });
        return Comment.aggregate([
          // Restrict to subset of threads (todo: paginate).
          { $match: { rootEntity: { $in: threadIds } } },
          { $group: { _id: '$rootEntity', count: { $sum: 1 } } }
        ])
          .then((counts) => {
            // TODO: loop and make commentCount = zero for all threads.
            // TODO: loop through threads and add counts:
            const expandedThreads = map(threads, (thread) => {
              const expandedThread = Object.assign({}, thread.toObject(), { commentCount: 0 });
              return expandedThread;
            });
            // Let's make a map of our counts to make it easier to look up:
            const countsMap = {};
            each(counts, (count) => {
              countsMap[count._id] = count.count;
            });

            /* eslint-disable no-param-reassign */
            each(expandedThreads, (expandedThread) => {
              if (countsMap[expandedThread._id]) {
                expandedThread.commentCount = countsMap[expandedThread._id];
              }
            });
            /* eslint-enable no-param-reassign */

            return expandedThreads;
          });
      });
  }

  /*
  list() {
    const query = {};
    query.deleted = false;
    return this.find(query)
      .populate('author', '-password')
      .exec();
  }
  */
};

export default mongoose.model('ForumThread', ForumThreadSchema);
