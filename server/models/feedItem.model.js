import mongoose, { Schema } from 'mongoose';
import Vote from './vote.model';
import config from '../../config/config';

const FeedItemSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedLink: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RelatedLink'
  },
  randomOrder: {
    type: Number,
    default: 0
  }
});

FeedItemSchema.statics = {
  // This doesn't paginate currently:
  list({
    limit = 10,
    user = null
  } = {}) {
    const query = { user };
    const limitOption = parseInt(limit, 10);

    return this.find(query)
      .populate('user', '-password')
      // Deep populate: https://github.com/Automattic/mongoose/issues/5696
      .populate({ path: 'relatedLink', populate: { path: 'author' } })
      .populate({ path: 'relatedLink', populate: { path: 'post' } })
    // .populate({ path: 'relatedLink', populate: { path: 'post', populate: { path: 'thread' } } })
      .sort({ randomOrder: -1 })
      .limit(limitOption)
      .exec()
      .then((itemsFound) => {
        const foundProcessed = itemsFound.map((item) => {
          console.log('-');
          return Object.assign({}, item.toObject());
        });
        if (!user) {
          return foundProcessed;
        }
        return this.addVotesForUserToEntities(foundProcessed, user._id);
      });
  },

  addVotesForUserToEntities(items, userId) {
    const ids = items.map((item) => { //eslint-disable-line
      return item.relatedLink._id;
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
        for (let index in items) { // eslint-disable-line
          const currentItem = items[index];
          const entity = currentItem.relatedLink;
          const vote = voteMap[entity._id];
          const updatedEntity = Vote.generateEntityVoteInfo(entity, vote);
          currentItem.relatedLink = updatedEntity;
          updatedEntities.push(currentItem);
        }

        return updatedEntities;
      });
  }

};

export default mongoose.model(`${config.mongo.collectionPrefix}FeedItem`, FeedItemSchema);

// Can have the frontend interweave the form posts .. nope.catch((

// APIs for each type and per user can return:
// Should have each feed be made up of a few calls:

// Feed is a mixture of things...


// Feed item random

// FeedGeneator fetches each related link for one user based on their listened
// history. Can start with 100 / 30 max links.

// Backend API adds the forum posts most recent so it's always new stuff in there
// Random aggregate:
// https://stackoverflow.com/questions/2824157/random-record-from-mongodb
// https://stackoverflow.com/questions/13910751/random-sort-order

/*
db.articles.aggregate([
    { $match : { topic : 3 } },
    { $sample : { size: 3 } }
])


Cron Script - Steps:
1) Give me all listens for user sorted by most recent.
2) Collect all related links for those episodes.
3) Remove all FeedItems for user
3) Put new collection links (30) into FeedItem collection/table.

API / Backend:
1) Pull 15-30 random related links from feedItem
2) Serve 10-15 latest active forum threads
3) Mix and match and push to frontend

*/
