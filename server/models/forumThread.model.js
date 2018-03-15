import mongoose from 'mongoose';
import map from 'lodash/map';
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
  date: { type: Date, default: Date.now }
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

  list() {
    const query = {};
    query.deleted = false;
    return this.find(query)
      .populate('author', '-password')
      .exec()
      .then((threads) => {
        // Let's fill in the commentCount for each thread.
        // First we get the ids in an array:
        const threadIds = map(threads, (thread) => {
          // Get Thread ids
          console.log('thread');
          return thread._id;
        });
        console.log('threadIds', threadIds);
        return Comment.aggregate([
          // Restrict to subset of threads (todo: paginate).
          { $match: { rootEntity: { $in: threadIds } } },
          { $group: { _id: '$rootEntity', count: { $sum: 1 } } }
        ])
          .then((result) => {
            // TODO: loop and make commentCount = zero for all threads.
            // TODO: loop through threads and add counts:
            console.log('-----------RESULT', result);
            // return result;
            return threads;
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
