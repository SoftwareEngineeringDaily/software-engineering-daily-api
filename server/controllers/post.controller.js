import raccoon from 'raccoon';

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
  const { limit = 50, skip = 0, createdAtBefore = null } = req.query;

  let query = { limit };
  if (createdAtBefore) query.createdAtBefore = createdAtBefore;

  Post.list(query)
    .then(users => res.json(users))
    .catch(e => next(e));
}

/**
 * Vote a post
 */
function upvote(req, res, next) {
  let post = req.post;
  Vote.findOne({
    postId: post._id,
    userId: req.user._id,
  })
  .then((vote) => {
    let userIdString = req.user._id.toString();
    let postIdString = post._id.toString();
    if (vote) {
      vote.active = !vote.active;

      if (vote.direction !== 'upvote') {
        vote.direction = 'upvote';
        vote.active = true;
      }

      if (vote.active) {
        raccoon.liked(userIdString, postIdString);
      } else {
        raccoon.unliked(userIdString, postIdString);
      }

      return vote.save();
    }

    let newvote = new Vote();
    newvote.postId = post._id;
    newvote.userId = req.user._id;
    newvote.direction = 'upvote'; // @TODO: Make constant

    raccoon.liked(userIdString, postIdString);

    return newvote.save();
  })
  .then((vote) => {
    req.vote = vote; // eslint-disable-line no-param-reassign
    return res.json(vote)
  })
  .catch((e) => {
    next(e);
  });
}

function downvote(req, res, next) {
  let post = req.post;

  Vote.findOne({
    postId: post._id,
    userId: req.user._id,
  })
  .then((vote) => {
    if (vote) {
      vote.active = !vote.active;

      if (vote.direction !== 'downvote') {
        vote.direction = 'downvote';
        vote.active = true;
      }

      if (vote.active) {
        raccoon.disliked(req.user._id.toString(), post._id.toString());
      } else {
        raccoon.undisliked(req.user._id.toString(), post._id.toString());
      }

      return vote.save();
    }

    let newvote = new Vote();
    newvote.postId = post._id;
    newvote.userId = req.user._id;
    newvote.direction = 'downvote'; // @TODO: Make constant

    raccoon.disliked(req.user._id.toString(), post._id.toString());

    return newvote.save();
  })
  .then((vote) => {
    req.vote = vote; // eslint-disable-line no-param-reassign
    return res.json(vote)
  })
  .catch(e => next(e));
}

// @TODO: maybe this should be in a recommendation controller
function recommendations (req, res, next) {
  let numberOfRecommendations = 10;
  raccoon.recommendFor(req.user._id.toString(), numberOfRecommendations)
  .then((recommendations) => {
    return res.json(recommendations);
  })
  .catch((e) => {
    next(e);
  });
}


export default { load, get, list, upvote, downvote, recommendations };
