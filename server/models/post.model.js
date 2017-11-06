import Promise from 'bluebird';
import mongoose from 'mongoose';
import moment from 'moment';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Vote from './vote.model';

/**
 * Post Schema
 */
const PostSchema = new mongoose.Schema({
  id: String,
  score: { type: Number, default: 0 },
  totalFavorites: { type: Number, default: 0 },
  title: {
    rendered: String,
  },
  content: {
    rendered: String,
  },
  date: { type: Date, default: Date.now }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

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
      .exec()
      .then((post) => {
        if (post) {
          return post;
        }
        const err = new APIError('No such post exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List posts in descending order of 'createdAt' timestamp.
   * @param {number} limit - Limit number of posts to be returned.
   * @param {date} createdAtBefore - Date post was created before.
   * @param {date} createdAfter - Date post was created after.
   * @param {list} tags - List of Tags Ids
   * @param {list} categories - List of Categories
   * @param {string} search - Post Title to search
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
    search = null
  } = {}) {
    const query = { };
    let posts;
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
    if (search) query.$text = { $search: search };

    const limitOption = parseInt(limit, 10);

    let sort = { date: dateDirection };

    if (type === 'top') {
      sort = { score: -1 };
    }

    // return this.find().count()
    //   .then((count) => {
    //     numberOfPages = Math.floor(count / limit);
    //
    //     return this.find(query)
    //       .sort(sort)
    //       .limit(limit)
    //       .exec();
    //   })

    return this.find(query, 'content title date mp3 link score featuredImage upvoted downvoted tags categories')
      .sort(sort)
      .limit(limitOption)
      .then((postsFound) => {
        posts = postsFound;
        // Flip direct back
        if (dateDirection === 1) {
          posts.reverse();
        }
        if (!user) return posts;

        const postIds = posts.map((post) => { //eslint-disable-line
          return post._id;
        });

        return Vote.find({$or: [
          {
            userId: user._id,
            postId:  postIds,
          },            {
            userId: user._id,
            entityId: postIds,
          },
        ]}).exec();
      })
      .then((votes) => {
        if (!user) return posts;
        const voteMap = {};
        for (let index in votes) { // eslint-disable-line
          const vote = votes[index];
          const voteKey = vote.postId?  vote.postId : vote.entityId;
          voteMap[voteKey] = vote;
        }

        const updatedPosts = [];
        for (let index in posts) { // eslint-disable-line
          const post = posts[index].toObject();
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

// Indexes
PostSchema.index({ 'title.rendered': 'text', 'content.rendered': 'text' });

/**
 * @typedef Post
 */
export default mongoose.model('Post', PostSchema);
