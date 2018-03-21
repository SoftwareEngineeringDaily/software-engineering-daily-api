import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Vote from './vote.model';

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
   * Get thread
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

  list({
    user = null,
  } = {}) {
    const query = {};
    query.deleted = false;
    return this.find(query)
      .populate('author', '-password')
      .sort({ dateLastAcitiy: -1 })
      .exec()
      .then((threadsFound) => {
        const threadsFoundProcessed = threadsFound.map((thread) => {
          console.log('-');
          return Object.assign({}, thread.toObject());
        });
        if (!user) {
          return threadsFoundProcessed;
        }
        return this.addVotesForUserToEntities(threadsFoundProcessed, user._id);
      });
  },

  addVotesForUserToEntities(entities, userId) {
    const ids = entities.map((entity) => { //eslint-disable-line
      return entity._id;
    });
    return Vote.find({
      userId,
      entityId: { $in: ids },
    })
      .exec()
      .then((votes) => {
        const voteMap = {};
        for (let index in votes) { // eslint-disable-line
          const vote = votes[index];
          const voteKey = vote.entityId;
          voteMap[voteKey] = vote;
        }

        const updatedEntities = [];
        for (let index in entities) { // eslint-disable-line
          const entity = entities[index];
          const vote = voteMap[entity._id];
          updatedEntities.push(Vote.generateEntityVoteInfo(vote, entity));
        }

        return updatedEntities;
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
