import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

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
      forumThread.commentsCount += 1;
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
      .exec();
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
