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
    if (vote) {
      vote.active = !vote.active;

      if (vote.direction !== 'upvote') {
        vote.direction = 'upvote';
        vote.active = true;
      }

      if (vote.active) {
        // raccoon.voted('userId', 'itemId')
      } else {
        // raccoon.unvoted('userId', 'itemId')
      }

      return vote.save();
    }

    let newvote = new Vote();
    newvote.postId = post._id;
    newvote.userId = req.user._id;
    newvote.direction = 'upvote'; // @TODO: Make constant

    // raccoon.voted('userId', 'itemId')

    return newvote.save();
  })
  .then((vote) => {
    req.vote = vote; // eslint-disable-line no-param-reassign
    return res.json(vote)
  })
  .catch(e => next(e));
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
        // raccoon.voted('userId', 'itemId')
      } else {
        // raccoon.unvoted('userId', 'itemId')
      }

      return vote.save();
    }

    let newvote = new Vote();
    newvote.postId = post._id;
    newvote.userId = req.user._id;
    newvote.direction = 'downvote'; // @TODO: Make constant

    // raccoon.voted('userId', 'itemId')

    return newvote.save();
  })
  .then((vote) => {
    req.vote = vote; // eslint-disable-line no-param-reassign
    return res.json(vote)
  })
  .catch(e => next(e));
}

export default { load, get, list, upvote, downvote };
