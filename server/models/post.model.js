import Promise from 'bluebird';
import mongoose from 'mongoose';
import moment from 'moment';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Vote from './vote.model';
import config from '../../config/config';

const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

/**
 * @swagger
 * definitions:
 *   Post:
 *     type: object
 *     properties:
 *       _id:
 *         $ref: '#/definitions/ObjectId'
 *       __v:
 *         $ref: '#/definitions/MongoVersion'
 *       title:
 *         type: object
 *         properties:
 *           rendered:
 *             type: string
 *             description: HTML for title
 *             example: Bitcoin Segwit with Jordan Clifford
 *       content:
 *         type: object
 *         properties:
 *           rendered:
 *             type: string
 *             description: HTML for content
 *             example: <!--powerpress_player--><div class...
 *       date:
 *         type: string
 *         format: date-time
 *         description: Date when episode was posted
 *         example: 2017-10-10T02:00:40.000Z
 *       score:
 *         type: integer
 *         description: Number of upvotes given to episode by logged in users
 *         example: 3
 *       upvote:
 *         type: boolean
 *         description: if authenticated, returns if user upvoted episode
 *       downvote:
 *         type: boolean
 *         description: if authenticated, returns if user downvoted episode
 *       bookmarked:
 *         type: boolean
 *         description: if authenticated, returns if user bookmarked the episode
 *     required:
 *       - _id
 *       - title
 *       - content
 *       - date
 *       - score
 */

const PostSchema = new mongoose.Schema({
  id: String,
  score: { type: Number, default: 0 },
  totalFavorites: { type: Number, default: 0 },
  title: {
    rendered: String,
  },
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumThread'
  },
  content: {
    rendered: String,
  },
  date: { type: Date, default: Date.now },
  transcriptUrl: { type: String, default: '' },
  topics: Array,
  slug: { type: String, slug: 'name', unique: true },
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

PostSchema.virtual('bookmarkedByUser', {
  ref: 'Favorite',
  localField: '_id',
  foreignField: 'postId',
  justOne: true
});

/**
 * Methods
 */
PostSchema.method({
});

/**
 * Statics
 */
PostSchema.statics = {
  /**
   * Get post
   * @param {ObjectId} id - The objectId of post.
   * @returns {Promise<Post, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate('thread')
      .exec()
      .then((post) => {
        if (post) {
          return post;
        }
        const err = new APIError('No such post exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  // standard list of fields to select for find Post queries
  standardSelectForFind: 'content title date mp3 link score featuredImage guestImage upvoted downvoted tags categories thread excerpt transcriptUrl topics',
  /**
   * List posts in descending order of 'createdAt' timestamp.
   * @param {number} limit - Limit number of posts to be returned.
   * @param {date} createdAtBefore - Date post was created before.
   * @param {date} createdAfter - Date post was created after.
   * @param {list} tags - List of Tags Ids
   * @param {list} categories - List of Categories
   * @param {string} search - Post Title to search
   * @param {string} transcripts - Get posts with or without transcripts
   * @returns {Promise<Post[]>}
   */
  list({
    limit = 10,
    createdAtBefore = null,
    user = null,
    createdAfter = null,
    type = null,
    tags = [],
    categories = [],
    topic = null,
    search = null,
    transcripts = null
  } = {}) {
    const query = {};
    // @TODO use
    let numberOfPages = 0; //eslint-disable-line

    let dateDirection = -1;
    if (createdAtBefore) query.date = { $lt: moment(createdAtBefore).toDate() };
    if (createdAfter) {
      dateDirection = 1;
      query.date = { $gt: moment(createdAfter).toDate() };
    }

    if (tags.length > 0) query.tags = { $all: tags };
    if (categories.length > 0) query.categories = { $all: categories };
    if (topic) query.topics = { $in: topic };
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

    if (transcripts === 'true') {
      query.transcriptUrl = { $exists: true };
    } else if (transcripts === 'false') {
      query.transcriptUrl = { $exists: false };
    }

    const limitOption = parseInt(limit, 10);

    let sort = { date: dateDirection };

    if (type === 'top') {
      sort = { score: -1 };
    }
    const queryPromise = this.find(query, this.standardSelectForFind)
      .populate('thread')
      .sort(sort)
      .limit(limitOption);

    // Flip direction back if originally limited by descending date filter
    if (dateDirection === 1) {
      queryPromise.sort({ date: -1 });
    }
    if (!user) {
      return queryPromise.then(postsFound => postsFound);
    }

    return queryPromise.populate({
      path: 'bookmarkedByUser',
      select: 'active',
      match: { userId: user._id }
    })
      // .lean() // returns as plain object, but this will remove deafault values which is bad
      .exec()
      .then((postsFound) => {
      // add bookmarked
        const postsWithBookmarked = postsFound.map((post) => {
          const _post = post;
          const { bookmarkedByUser } = _post;
          const bookmarked = bookmarkedByUser ? bookmarkedByUser.active : false;
          delete _post.bookmarkedByUser;
          return Object.assign({}, post.toObject(), { bookmarked });
        });
        // add vote info
        return this.addVotesForUserToPosts(postsWithBookmarked, user._id);
      });
  },
  addVotesForUserToPosts(posts, userId) {
    const postIds = posts.map((post) => { //eslint-disable-line
      return post._id;
    });
    return Vote.find({
      $or: [
        {
          userId,
          postId: { $in: postIds },
        }, {
          userId,
          entityId: { $in: postIds },
        },
      ]
    })
      .exec()
      .then((votes) => {
        const voteMap = {};
        for (let index in votes) { // eslint-disable-line
          const vote = votes[index];
          const voteKey = vote.postId ? vote.postId : vote.entityId;
          voteMap[voteKey] = vote;
        }

        const updatedPosts = [];
        for (let index in posts) { // eslint-disable-line
          const post = posts[index];
          post.upvoted = false;
          post.downvoted = false;

          if (!voteMap[post._id]) {
            updatedPosts.push(post);
            continue; // eslint-disable-line
          }

          if (voteMap[post._id].direction === 'upvote' && voteMap[post._id].active) {
            post.upvoted = true;
          }

          if (voteMap[post._id].direction === 'downvote' && voteMap[post._id].active) {
            post.downvoted = true;
          }

          updatedPosts.push(post);
        }

        return updatedPosts;
      });
  }
};

PostSchema.index({ 'title.rendered': 'text', 'content.rendered': 'text' });

export default mongoose.model(`${config.mongo.collectionPrefix}Post`, PostSchema);
