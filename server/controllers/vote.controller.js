import Bluebird from 'bluebird';

import Vote from '../models/vote.model';
import Comment from '../models/comment.model';
import { subscribePostFromEntity } from '../controllers/postSubscription.controller';
import { saveAndNotifyUser } from '../controllers/notification.controller';

/**
 * @swagger
 * tags:
 * - name: vote
 *   description: Voting of Items (episode, comment) Up & Down
 */

/**
 * @swagger
 * parameters:
 *   voteId:
 *     name: voteId
 *     in: path
 *     description: Mongo ObjectId of vote
 *     required: true
 *     type: string
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
 * @swagger
 *   /votes/{voteId}:
 *     get:
 *       summary: Get specific vote
 *       description: Get specific vote cast by user
 *       tags: [vote]
 *       security:
 *         - Token: []
 *       parameters:
 *         - $ref: '#/parameters/voteId'
 *       responses:
 *         '401':
 *           $ref: '#/responses/Unauthorized'
 *         '404':
 *           $ref: '#/responses/NotFound'
 */

function get(req, res) {
  return res.json(req.vote);
}

/**
 * @swagger
 *   /votes:
 *     get:
 *       summary: Get upvotes and downvotes
 *       description: Get upvotes and downvotes made by the current user
 *       tags: [vote]
 *       security:
 *         - Token: []
 *       parameters:
 *         - $ref: '#/parameters/limit'
 *         - $ref: '#/parameters/skip'
 *       responses:
 *         '200':
 *           description: successful operation
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/definitions/Vote'
 *         '401':
 *           $ref: '#/responses/Unauthorized'
 */

function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Vote.list({ limit, skip }, req.user._id)
    .then(votes => res.json(votes))
    .catch(e => next(e));
}

function findVote(req, res, next) {
  // TODO: REMOVE once we migrate over to entityId only

  const successCB = (vote) => {
    if (vote) {
      req.vote = vote;
    }
    next();
  };

  error => next(error); // eslint-disable-line

  // We need to account for the fact that posts could either be
  // liked under entityId or postId
  if (req.post) {
    Vote.findOne({
      $or: [
        { postId: req.post._id, userId: req.user._id },
        { entityId: req.entity._id, userId: req.user._id }
      ]
    })
      .then(successCB)
      .catch((error) => {
        next(error);
      });
  } else {
    Vote.findOne({
      entityId: req.entity._id,
      userId: req.user._id
    })
      .then(successCB)
      .catch((error) => {
        next(error);
      });
  }
}

/**
 * @swagger
 * /posts/{postId}/upvote:
 *   post:
 *     summary: Upvote episode by ID
 *     description: Upvote episode by ID
 *     tags: [vote]
 *     security:
 *       # indicates security authorization required
 *       # empty array because no "scopes" for non-OAuth
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Vote'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */

function upvote(req, res, next) {
  const { entity } = req;

  if (!entity.score) entity.score = 0;
  let promise;
  const { vote } = req;

  // TODO: rewrite this to have it be model / entity.liked(vote)
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
      entity.score += incrementValue;
      req.liked = true;
    } else {
      entity.score -= incrementValue;
      req.unliked = true;
    }
    promise = Bluebird.all([vote.save(), entity.save()]);
  } else {
    const newvote = new Vote();
    newvote.entityId = entity._id;
    // SPECIAL CASE to be removed when vote.postId is deprecreated from mobile
    // we should really be versioning the API.....
    if (req.post && req.post._id === req.entity._id) {
      newvote.postId = entity._id;
    }

    newvote.userId = req.user._id;
    newvote.direction = 'upvote'; // @TODO: Make constant
    entity.score += 1;
    req.liked = true;

    promise = Bluebird.all([newvote.save(), entity.save()]);
  }
  promise
    .then((results) => {
      req.vote = results[0]; // eslint-disable-line
      req.entity = results[1]; // eslint-disable-line
      next();
    })
    .catch((e) => {
      next(e);
    });
}

/**
 * @swagger
 * /posts/{postId}/downvote:
 *   post:
 *     summary: Downvote episode by ID
 *     description: Downvote episode by ID
 *     tags: [vote]
 *     security:
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Vote'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */

function downvote(req, res, next) {
  const { entity } = req;

  if (!entity.score) entity.score = 0;
  let promise;
  const { vote } = req;
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
      req.disliked = true;
    } else {
      entity.score += incrementValue;
      req.undisliked = true;
    }

    promise = Bluebird.all([vote.save(), entity.save()]);
  } else {
    const newvote = new Vote();
    newvote.entityId = entity._id;
    // SPECIAL CASE to be removed when vote.postId is deprecreated from mobile
    if (req.post && req.post._id === req.entity._id) {
      newvote.postId = entity._id;
    }
    newvote.userId = req.user._id;
    newvote.direction = 'downvote'; // @TODO: Make constant
    entity.score -= 1;

    req.disliked = true;

    promise = Bluebird.all([newvote.save(), entity.save()]);
  }
  promise
    .then((results) => {
      req.vote = results[0]; // eslint-disable-line
      req.entity = results[1]; // eslint-disable-line
      next();
    })
    .catch(e => next(e));
}

async function subscribeAndNotify(vote, user) {
  const comment = await Comment.findOne({ _id: vote.entityId });

  if (!comment || (comment && user._id === comment.author)) {
    return;
  }

  const post = await subscribePostFromEntity(comment.rootEntity, user);

  if (!post) {
    return;
  }

  const payload = {
    notification: {
      title: `New upvote from @${user.username}`,
      body: post.title.rendered,
      data: {
        user: user.username,
        commentAuthor: comment.author,
        thread: post.thread,
        slug: post.slug
      }
    },
    type: 'upvote',
    entity: post._id
  };

  // just notify the commenter
  saveAndNotifyUser(payload, comment.author);
}

function finish(req, res) {
  req.vote = req.vote.toObject();
  if (req.vote.direction === 'upvote') subscribeAndNotify(req.vote, req.user);
  // Pass down the entity
  // We are getting the correct vote information to be part of the
  // entity object so that the clients can have an easier time figuring
  // out if something has been liked or not. It keeps a consistent
  // pattern to how entities come down on their own.
  req.vote.entity = Vote.generateEntityVoteInfo(req.entity.toObject(), req.vote);
  return res.json(req.vote);
}

export default {
  load,
  get,
  findVote,
  finish,
  list,
  upvote,
  downvote
};
