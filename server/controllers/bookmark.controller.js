import Bluebird from 'bluebird';

// Keeping Bookmark naming for model for now to defer database migration issues
// but all else will be renamed to bookmark for cross-project consistency
import Favorite from '../models/favorite.model';

/**
 * @swagger
 * tags:
 * - name: bookmark
 *   description: Bookmarking Episodes and Other Items
 */

/**
 * @swagger
 * parameters:
 *   bookmarkId:
 *     name: bookmarkId
 *     in: path
 *     description: Mongo ObjectId of bookmark
 *     required: true
 *     type: string
 */

function load(req, res, next, id) {
  Favorite.get(id, req.user._id)
    .then((bookmarkFound) => {
      req.bookmark = bookmarkFound; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * @swagger
 * /bookmarks/{bookmarkId}:
 *   get:
 *     summary: Get bookmark
 *     description: Get specific bookmark by id
 *     tags: [bookmark]
 *     security:
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/bookmarkId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Bookmark'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
 * /favorites/{bookmarkId}:
 *   get:
 *     summary: Get specific bookmark
 *     description: Get specific bookmark picked by user
 *     tags: [bookmark]
 *     deprecated: true
 *     security:
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/bookmarkId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Bookmark'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */
function get(req, res) {
  return res.json(req.bookmark);
}

/**
 * @swagger
 * /bookmarks:
 *   get:
 *     summary: Get bookmarked items
 *     description: Get list of bookmarks for current user.
 *     tags: [bookmark]
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
 *             $ref: '#/definitions/Bookmark'
 * /favorites:
 *   get:
 *     summary: Get favorited episodes
 *     description: Get list of favorited episodes for current user.
 *     tags: [bookmark]
 *     deprecated: true
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
 *             $ref: '#/definitions/Bookmark'
 */

function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Favorite.list({ limit, skip }, req.user._id)
    .then(favorites => res.json(favorites))
    .catch(e => next(e));
}

/**
 * @swagger
 * /posts/{postId}/bookmark:
 *   post:
 *     summary: Bookmark post
 *     description: |
 *       Add bookmark to post for current user.
 *     tags: [bookmark]
 *     security:
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Bookmark'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
 * /posts/{postId}/favorite:
 *   post:
 *     summary: Favorite episode
 *     description: |
 *       Favorite or star episode for current user.
 *     deprecated: true
 *     tags: [bookmark]
 *     security:
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Bookmark'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */
function bookmark(req, res, next) {
  const { post } = req;
  if (!post.totalFavorites) post.totalFavorites = 0;

  Favorite.findOne({
    postId: post._id,
    userId: req.user._id
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
      req.favorite = favorite[0]; // eslint-disable-line
      return res.json(favorite[0]);
    })
    .catch((e) => {
      next(e);
    });
}

/**
 * @swagger
 * /posts/{postId}/unbookmark:
 *   post:
 *     summary: Unbookmark post
 *     description: |
 *       Remove bookmark of post for current user.
 *     tags: [bookmark]
 *     security:
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Bookmark'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
 * /posts/{postId}/unfavorite:
 *   post:
 *     summary: Unfavorite episode
 *     description: |
 *       Unfavorite episode for current user.
 *     deprecated: true
 *     tags: [bookmark]
 *     security:
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Bookmark'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */
function unbookmark(req, res, next) {
  const { post } = req;
  if (!post.totalFavorites) post.totalFavorites = 0;

  Favorite.findOne({
    postId: post._id,
    userId: req.user._id
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
      req.favorite = favorite; // eslint-disable-line
      return res.json(favorite[0]);
    })
    .catch((e) => {
      next(e);
    });
}

export default {
  load,
  get,
  list,
  bookmark,
  unbookmark
};
