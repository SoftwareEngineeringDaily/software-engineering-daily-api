import Bluebird from 'bluebird';

import Favorite from '../models/favorite.model';

/**
 * Load favorite and append to req.
 */
function load(req, res, next, id) {
  Favorite.get(id, req.user._id)
    .then((favoriteFound) => {
      req.favorite = favoriteFound; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => {
      console.log("error:", e)
      next(e)
    });
}

/**
 * Get favorite
 * @returns {Favorite}
 */
function get(req, res) {
  return res.json(req.favorite);
}

/**
 * Create new favorite
 * @property {string} req.body.active - The active state of the favorite.
 * @returns {Favorite}
 */
function create(req, res, next) {
  const newFavorite = new Favorite({
    active: req.body.active
  });

  newFavorite.save()
    .then(savedFavorite => res.json(savedFavorite))
    .catch(e => next(e));
}

/**
 * Update existing favorite
 * @property {string} req.body.active - The active state of the favorite.
 * @returns {Favorite}
 */
function update(req, res, next) {
  const updateFavorite = req.favorite;
  updateFavorite.active = req.body.active;

  updateFavorite.save()
    .then(savedFavorite => res.json(savedFavorite))
    .catch(e => next(e));
}

/**
 * Get favorite list.
 * @property {number} req.query.skip - Number of favorites to be skipped.
 * @property {number} req.query.limit - Limit number of favorites to be returned.
 * @returns {Favorite[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Favorite.list({ limit, skip }, req.user._id)
    .then(favorites => res.json(favorites))
    .catch(e => next(e));
}

/**
 * Delete favorite.
 * @returns {Favorite}
 */
function remove(req, res, next) {
  const existingVavorite = req.favorite;
  existingVavorite.remove()
    .then(deletedFavorite => res.json(deletedFavorite))
    .catch(e => next(e));
}

/*
 * This function should be called from the post.route.
 * At this point the post should be part of the request.
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

/*
 * This function should be called from the post.route.
 * At this point the post should be part of the request.
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

export default { load, get, create, update, list, remove, favorite, unfavorite };
