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
  score: {type: Number, score: 0},
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
  list({ skip = 0, limit = 50, createdAtBefore = null , user = null} = {}) {

    let query = { };
    if (createdAtBefore) query.date = {$lt: moment(createdAtBefore).toDate()};

    let posts;

    return this.find(query)
      .sort({ createdAt: -1 })
      .limit(+limit)
      .exec()
      .then((postsFound) => {
        posts = postsFound;

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
