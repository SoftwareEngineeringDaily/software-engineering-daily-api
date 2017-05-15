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
  score: {type: Number, default: 0},
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
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<Post, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<Post[]>}
   */
  list({ skip = 0, limit = 50, createdAtBefore = null , user = null, createdAfter = null, type = null} = {}) {

    let query = { };
    let posts;
    let numberOfPages = 0;
    let dateDirection = -1;
    if (createdAtBefore) query.date = {$lt: moment(createdAtBefore).toDate()};
    if (createdAfter) {
      dateDirection = 1;
      query.date =  {$gt: moment(createdAfter).toDate()};
    }

    let sort = { date: dateDirection };

    if (type === 'top') {
      sort = { score : -1 };
    }

    return this.find().count()
      .then((count) => {
        numberOfPages = Math.floor(count/limit)

        return this.find(query)
          .sort(sort)
          .limit(limit)
          .exec()
      })
      .then((postsFound) => {
        posts = postsFound;
        // Flip direct back
        if (dateDirection === 1) {
          posts.reverse();
        }
        if (!user) return posts;

        let postIds = posts.map((post) => {
          return post._id;
        });

        return Vote.find({
          userId: user._id,
          postId: {$in: postIds}
        }).exec();
      })
      .then((votes) => {
        if (!user) return posts;

        let voteMap = {};
        for (let index in votes) {
          let vote = votes[index];
          voteMap[vote.postId] = vote;
        }

        let updatedPosts = [];
        for (let index in posts) {
          let post = posts[index].toObject();
          post.upvoted = false;
          post.downvoted = false;

          if (!voteMap[post._id]) {
            updatedPosts.push(post);
            continue;
          };

          if (voteMap[post._id].direction === 'upvote' && voteMap[post._id].active) {
            post.upvoted = true;
          }

          if (voteMap[post._id].direction === 'downvote' && voteMap[post._id].active) {
            post.downvoted = true;
          }

          updatedPosts.push(post);
        }

        return updatedPosts;
      })
  }
};

/**
 * @typedef Post
 */
export default mongoose.model('Post', PostSchema);
