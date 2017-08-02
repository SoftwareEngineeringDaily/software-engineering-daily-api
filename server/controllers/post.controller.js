import raccoon from 'raccoon';
import Bluebird from 'bluebird';
import mongoose from 'mongoose';

import Post from '../models/post.model';
import Vote from '../models/vote.model';

/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  Post.get(id)
    .then((post) => {
      req.post = post; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get user
 * @returns {Post}
 */
function get(req, res) {
  return res.json(req.post);
}

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {Post[]}
 */
function list(req, res, next) {
  const { limit = 50, createdAtBefore = null,
      createdAfter = null, type = null, tags = null, categories = null } = req.query;

  const query = { limit };
  if (createdAtBefore) query.createdAtBefore = createdAtBefore;
  if (createdAfter) query.createdAfter = createdAfter;
  if (type) query.type = type;
  if (req.user) query.user = req.user;
  if (tags) {
    query.tags = tags.split(',');
    let newTags = []; //eslint-disable-line
    query.tags.forEach((tag) => {
      newTags.push(parseInt(tag, 10));
    });
    query.tags = newTags;
  }

  if (categories) {
    query.categories = categories.split(',');
    let newTags = []; //eslint-disable-line
    query.categories.forEach((tag) => {
      newTags.push(parseInt(tag, 10));
    });
    query.categories = newTags;
  }

  Post.list(query)
    .then(users => res.json(users))
    .catch(e => next(e));
}

/**
 * Vote a post
 */
function upvote(req, res, next) {
  const post = req.post;

  if (!post.score) post.score = 0;

  Vote.findOne({
    postId: post._id,
    userId: req.user._id,
  })
  .then((voteFound) => {
    const vote = voteFound;
    const userIdString = req.user._id.toString();
    const postIdString = post._id.toString();

    if (vote) {
      let incrementValue = 1;

      // We are changing directly form up to down
      if (vote.direction !== 'upvote' && vote.active) {
        incrementValue = 2;
      }

      vote.active = !vote.active;

      if (vote.direction !== 'upvote') {
        vote.direction = 'upvote';
        vote.active = true;
      }

      if (vote.active) {
        post.score += incrementValue;
        raccoon.liked(userIdString, postIdString);
      } else {
        post.score -= incrementValue;
        raccoon.unliked(userIdString, postIdString);
      }

      return Bluebird.all([vote.save(), post.save()]);
    }

    const newvote = new Vote();
    newvote.postId = post._id;
    newvote.userId = req.user._id;
    newvote.direction = 'upvote'; // @TODO: Make constant
    post.score += 1;
    raccoon.liked(userIdString, postIdString);

    return Bluebird.all([newvote.save(), post.save()]);
  })
  .then((vote) => {
    req.vote = vote[0]; // eslint-disable-line no-param-reassign
    return res.json(vote[0]);
  })
  .catch((e) => {
    next(e);
  });
}

function downvote(req, res, next) {
  const post = req.post;

  if (!post.score) post.score = 0;

  Vote.findOne({
    postId: post._id,
    userId: req.user._id,
  })
  .then((voteFound) => {
    const vote = voteFound;
    if (vote) {
      let incrementValue = 1;

      // We are changing directly form up to down
      if (vote.direction !== 'downvote' && vote.active) {
        incrementValue = 2;
      }

      vote.active = !vote.active;

      if (vote.direction !== 'downvote') {
        vote.direction = 'downvote';
        vote.active = true;
      }

      if (vote.active) {
        post.score -= incrementValue;
        raccoon.disliked(req.user._id.toString(), post._id.toString());
      } else {
        post.score += incrementValue;
        raccoon.undisliked(req.user._id.toString(), post._id.toString());
      }

      return Bluebird.all([vote.save(), post.save()]);
    }

    const newvote = new Vote();
    newvote.postId = post._id;
    newvote.userId = req.user._id;
    newvote.direction = 'downvote'; // @TODO: Make constant
    post.score -= 1;

    raccoon.disliked(req.user._id.toString(), post._id.toString());

    return Bluebird.all([newvote.save(), post.save()]);
  })
  .then((vote) => {
    req.vote = vote[0]; // eslint-disable-line no-param-reassign
    return res.json(vote[0]);
  })
  .catch(e => next(e));
}

// @TODO: maybe this should be in a recommendation controller
function recommendations(req, res, next) {
  const numberOfRecommendations = 10;
  raccoon.recommendFor(req.user._id.toString(), numberOfRecommendations)
  .then((recommendationsFound) => {
    const ids = recommendationsFound.map((rec) => {  //eslint-disable-line
      return mongoose.Types.ObjectId(rec); //eslint-disable-line
    });

    return Post.find({ _id: { $in: ids } });
  })
  .then((posts) => { //eslint-disable-line
    return res.json(posts);
  })
  .catch((e) => {
    next(e);
  });
}


export default { load, get, list, upvote, downvote, recommendations };
