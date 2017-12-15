import Bluebird from 'bluebird';

import Favorite from '../models/favorite.model';

/**
 * @swagger
 * tags:
 * - name: favorite
 *   description: Favoriting (aka staring/bookmarking) of Episodes
 */

/**
 * @swagger
 * parameters:
 *   favoriteId:
 *     name: favoriteId
 *     in: path
 *     description: Mongo ObjectId of favorite
 *     required: true
 *     type: string
 */

function load(req, res, next, id) {
  Favorite.get(id, req.user._id)
    .then((favoriteFound) => {
      req.favorite = favoriteFound; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * @swagger
 *   /favorites/{favoriteId}:
 *     get:
 *       summary: Get specific favorite
 *       description: Get specific favorite picked by user
 *       tags: [favorite]
 *       security:
 *         - Token: []
 *       parameters:
 *         - $ref: '#/parameters/favoriteId'
 *       responses:
 *         '200':
 *           description: successful operation
 *           schema:
 *             $ref: '#/definitions/Favorite'
 *         '401':
 *           $ref: '#/responses/Unauthorized'
 *         '404':
 *           $ref: '#/responses/NotFound'
 */
function get(req, res) {
  return res.json(req.favorite);
}

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Get favorited episodes
 *     description: Get list of favorited episodes for current user.
 *     tags: [favorite]
 *     security:
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/limit'
 *       - $ref: '#/parameters/skip'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Favorite'
 */

function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Favorite.list({ limit, skip }, req.user._id)
    .then(favorites => res.json(favorites))
    .catch(e => next(e));
}

/**
 * @swagger
 * /posts/{postId}/favorite:
 *   post:
 *     summary: Favorite episode
 *     description: |
 *       Favorite or star episode for current user.
 *     tags: [favorite]
 *     security:
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Favorite'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */
function favorite(req, res, next) {
  const post = req.post;
  if (!post.totalFavorites) post.totalFavorites = 0;

  Favorite.findOne({
    postId: post._id,
    userId: req.user._id,
  })
    .then((favoriteFound) => {
      const favorite = favoriteFound;

      if (favorite) {
        post.totalFavorites = !favorite.active ? post.totalFavorites + 1 : post.totalFavorites - 1;
        favorite.active = !favorite.active;

        return Bluebird.all([favorite.save(), post.save()]);
      }

      const newFavorite = new Favorite();
      newFavorite.postId = post._id;
      newFavorite.userId = req.user._id;
      post.totalFavorites += 1;

      return Bluebird.all([newFavorite.save(), post.save()]);
    })
    .then((favorite) => {
      req.favorite = favorite[0]; // eslint-disable-line no-param-reassign
      return res.json(favorite[0]);
    })
    .catch((e) => {
      next(e);
    });
}

/**
 * @swagger
 * /posts/{postId}/unfavorite:
 *   post:
 *     summary: Unfavorite episode
 *     description: |
 *       Unfavorite episode for current user.
 *     tags: [favorite]
 *     security:
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Favorite'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */
function unfavorite(req, res, next) {
  const post = req.post;
  if (!post.totalFavorites) post.totalFavorites = 0;

  Favorite.findOne({
    postId: post._id,
    userId: req.user._id,
  })
    .then((favoriteFound) => {
      const favorite = favoriteFound;

      if (favorite) {
        if (favorite.active) {
          post.totalFavorites -= 1;
          favorite.active = false;
        }

        return Bluebird.all([favorite.save(), post.save()]);
      }

      const newFavorite = new Favorite();
      newFavorite.active = false;
      newFavorite.postId = post._id;
      newFavorite.userId = req.user._id;

      return Bluebird.all([newFavorite.save()]);
    })
    .then((favorite) => {
      req.favorite = favorite[0]; // eslint-disable-line no-param-reassign
      return res.json(favorite[0]);
    })
    .catch((e) => {
      next(e);
    });
}

export default {
  load, get, list, favorite, unfavorite
};
