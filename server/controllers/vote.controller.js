import raccoon from 'raccoon';
import Bluebird from 'bluebird';
import mongoose from 'mongoose';

import Vote from '../models/vote.model';

/**
 * Load vote and append to req.
 */
function load(req, res, next, id) {
  Vote.get(id, req.user._id)
    .then((vote) => {
      req.vote = vote; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get vote
 * @returns {Vote}
 */
function get(req, res) {
  return res.json(req.vote);
}

/**
 * Get vote list.
 * @property {number} req.query.skip - Number of votes to be skipped.
 * @property {number} req.query.limit - Limit number of votes to be returned.
 * @returns {Vote[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Vote.list({ limit, skip }, req.user._id)
    .then(votes => res.json(votes))
    .catch(e => next(e));
}

// To have the mobile clients start puptting info insode of entityId
function movePostToEntity(req, res, next) {
  if (req.post) {
    req.entity = req.post;
  }
  next();
}

function findVote(req, res, next) {
  // TODO: REMOVE once we migrate over to entityId only
  const successCB = (vote) => {
    if( vote) {
      req.vote = vote;
    }
    next();
  };

  const errorCB = (error) => {
    next(error);
  };

  // We need to account for the fact that posts could either be
  // liked under entityId or postId
  if (req.post) {
    Vote.findOne({$or: [
      {postId: req.post._id, userId: req.user._id},
      {entityId: req.entity._id, userId: req.user._id}
    ]})
    .then(successCB)
    .catch(error);
  } else {
    Vote.findOne({
      entityId: req.entity._id,
      userId: req.user._id,
    })
    .then(successCB)
    .catch(error);
  }
}

/**
 * Upvote a post.
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

      // We are changing directly from down to up
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


/**
 * Downvote a post.
 */
function downvote(req, res, next) {
  const entity = req.entity;

  if (!entity.score) entity.score = 0;
  let promise;
  const vote = req.vote;
  if (vote) {
    let incrementValue = 1;

    // We are changing directly from up to down
    if (vote.direction !== 'downvote' && vote.active) {
      incrementValue = 2;
    }

    vote.active = !vote.active;

    if (vote.direction !== 'downvote') {
      vote.direction = 'downvote';
      vote.active = true;
    }

    if (vote.active) {
      entity.score -= incrementValue;
      raccoon.disliked(req.user._id.toString(), entity._id.toString());
    } else {
      entity.score += incrementValue;
      req.undisliked = true;
    }

    promise = Bluebird.all([vote.save(), entity.save()]);
  } else {

    const newvote = new Vote();
    newvote.entityId = entity._id;
    newvote.userId = req.user._id;
    newvote.direction = 'downvote'; // @TODO: Make constant
    entity.score -= 1;

    req.disliked = true

    promise = Bluebird.all([newvote.save(), entity.save()]);
  }
  promise
  .then((vote) => {
    req.vote = vote[0]; // eslint-disable-line no-param-reassign
    next();
  })
  .catch(e => next(e));
}

function finish(req, res, next) {
    return res.json(req.vote);
}

export default { load, get, list, upvote, downvote };
