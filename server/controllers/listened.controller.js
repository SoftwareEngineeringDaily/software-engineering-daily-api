import Bluebird from 'bluebird';
import Listened from '../models/listened.model';

/**
 * Create new favorite
 * @property {string} req.body.active - The active state of the favorite.
 * @returns {Listened}
 */
function create(req, res, next) {
  const post = req.post;
  const userId = req.user._id;

  // Get the item
  Listened.findOne({
    postId: post._id,
    userId
  }).then((listened) => {
    // Return the found item if any
    if (listened) {
      return Bluebird.all([listened.save()]);
    }
    // Create the new model
    const listenedModel = new Listened({
      userId,
      postId: post._id
    });
    return Bluebird.all([listenedModel.save()]);
  }).then(listened => res.json(listened)).catch((e) => {
    next(e);
  });
}

/**
 * Get the list of listened posts by post Id
 * .
 * @property {number} req.query.skip - Number of favorites to be skipped.
 * @property {number} req.query.limit - Limit number of favorites to be returned.
 * @returns {Listened[]}
 */
function listByPost(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Listened.listByPost({ limit, skip }, req.post._id)
    .then(favorites => res.json(favorites))
    .catch(e => next(e));
}

/**
 * Get the list of listened posts by post Id
 * .
 * @property {number} req.query.skip - Number of favorites to be skipped.
 * @property {number} req.query.limit - Limit number of favorites to be returned.
 * @returns {Listened[]}
 */
function listByUser(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Listened.listByUser({ limit, skip }, req.user._id)
    .then(favorites => res.json(favorites))
    .catch(e => next(e));
}

/**
 * Default export
 */
export default {
  create, listByPost, listByUser
};
