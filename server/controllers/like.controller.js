import Like from '../models/like.model';

/**
 * Load like and append to req.
 */
function load(req, res, next, id) {
  Like.get(id, req.user._id)
    .then((like) => {
      req.like = like; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get like
 * @returns {Like}
 */
function get(req, res) {
  return res.json(req.like);
}

/**
 * Create new like
 * @property {string} req.body.likename - The likename of like.
 * @property {string} req.body.mobileNumber - The mobileNumber of like.
 * @returns {Like}
 */
function create(req, res, next) {
  const like = new Like({
    likename: req.body.likename,
    mobileNumber: req.body.mobileNumber
  });

  like.save()
    .then(savedLike => res.json(savedLike))
    .catch(e => next(e));
}

/**
 * Update existing like
 * @property {string} req.body.likename - The likename of like.
 * @property {string} req.body.mobileNumber - The mobileNumber of like.
 * @returns {Like}
 */
function update(req, res, next) {
  const like = req.like;
  like.likename = req.body.likename;
  like.mobileNumber = req.body.mobileNumber;

  like.save()
    .then(savedLike => res.json(savedLike))
    .catch(e => next(e));
}

/**
 * Get like list.
 * @property {number} req.query.skip - Number of likes to be skipped.
 * @property {number} req.query.limit - Limit number of likes to be returned.
 * @returns {Like[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Like.list({ limit, skip }, req.user._id)
    .then(likes => res.json(likes))
    .catch(e => next(e));
}

/**
 * Delete like.
 * @returns {Like}
 */
function remove(req, res, next) {
  const like = req.like;
  like.remove()
    .then(deletedLike => res.json(deletedLike))
    .catch(e => next(e));
}

export default { load, get, create, update, list, remove };
