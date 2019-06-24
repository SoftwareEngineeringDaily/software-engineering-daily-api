// import mongoose from 'mongoose';

import Post from '../models/post.model';
import {
  getAdFreeSinglePostIfSubscribed,
  getAdFreePostsIfSubscribed
} from '../helpers/post.helper';

/**
 * @swagger
 * tags:
 * - name: post
 *   description: Podcast Episode (post) Information
 */

/**
 * @swagger
 * parameters:
 *   postId:
 *     name: postId
 *     in: path
 *     description: Mongo ObjectId of episode/post
 *     required: true
 *     type: string
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
 * @swagger
 * /posts/{postId}:
 *   get:
 *     summary: Get episode by ID
 *     description: Get episode by ID
 *     tags: [post]
 *     security: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Post'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */

function get(req, res, next) {
  // Load ad free version of podcast episode if subscrbied:

  return res.json(getAdFreeSinglePostIfSubscribed(req.post.toObject(), req.fullUser, next));
}

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get list of episodes
 *     description: Get list of most recent episodes. Use query paramters to filter results.
 *     tags: [post]
 *     security: [] #indicates no authorization required to use route
 *     parameters:
 *       - $ref: '#/parameters/limit'
 *       - in: query
 *         name: createdAtBefore
 *         type: string
 *         format: date-time #All date-time format follow https://xml2rfc.tools.ietf.org/public/rfc/html/rfc3339.html#anchor14
 *         required: false
 *         description: |
 *           The date/time the episode was created at or before,
 *           if not set ten latest episodes will be returned relative to current date
 *       - in: query
 *         name: createdAfter
 *         type: string
 *         format: date-time
 *         required: false
 *         description: The date/time the episode was created after
 *       - in: query
 *         name: transcripts
 *         type: boolean
 *         required: false
 *         description: |
 *            Using true returns posts with a transcriptUrl field,
 *            using false returns posts without
 *       - in: query
 *         name: type
 *         type: string
 *         required: false
 *         description: The type of episode
 *         enum: [new, top]
 *       - in: query
 *         name: search
 *         type: string
 *         required: false
 *         description: Search pattern for episode text
 *       - in: query
 *         name: tags
 *         type: array
 *         required: false
 *         collectionFormat: csv
 *         items:
 *           type: string
 *         description: Episode tag
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Post'
 */

function list(req, res, next) {
  const {
    limit = null,
    createdAtBefore = null,
    createdAfter = null,
    type = null,
    tags = null,
    categories = null,
    search = null,
    transcripts = null,
    topic = null
  } = req.query;

  const query = {};
  if (limit) query.limit = limit;
  if (createdAtBefore) query.createdAtBefore = createdAtBefore;
  if (createdAfter) query.createdAfter = createdAfter;
  if (type) query.type = type;
  if (req.user) query.user = req.user;
  if (search) query.search = search;
  if (transcripts) query.transcripts = transcripts;


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

  if (topic) {
    query.topic = [topic];
  }
  Post.list(query)
    .then(posts => res.json(getAdFreePostsIfSubscribed(posts, req.fullUser, next)))
    .catch(e => next(e));
}

// @TODO: maybe this should be in a recommendation controller

/**
 * @swagger
 * /recommendations:
 * get:
 *   summary: Get list of recommended episodes
 *   description: Get list of recommended episodes for authorized user
 *   tags: [post]
 *   security:
 *     - Token: []
 *   responses:
 *     '200':
 *       description: successful operation
 *       schema:
 *         type: array
 *         items:
 *           $ref: '#/definitions/Post'
 *     '401':
 *       $ref: '#/responses/Unauthorized'
 *     '404':
 *       $ref: '#/responses/NotFound'
 */

function recommendations(req, res) {
  // Raccoon recommendations were removed, so we return empty list for now
  res.json([]);
}

function upvote(req, res, next) {
  // Raccoon recommendations were removed, vote logic moved to vote controller
  next();
}

function downvote(req, res, next) {
  // Raccoon recommendations were removed, vote logic moved to vote controller
  next();
}

export default {
  load,
  get,
  list,
  recommendations,
  downvote,
  upvote
};
