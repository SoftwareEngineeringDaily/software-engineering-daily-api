import Tag from '../models/tag.model';

/**
 * TODO: Add swagger doc`
 * Load tag and append to req.
 */
function load(req, res, next, id) {
  Tag.get(id)
    .then((tag) => {
      req.tag = tag; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}


/**
 * Get tag.
 * @returns {Tag}
 */
function get(req, res) {
  return res.json(req.tag);
}

/**
 * Get tag list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {Tag[]}
 */
function list(req, res, next) {
  const {
    limit = null,
    skip = null
  } = req.query;

  const query = { };
  if (limit) query.limit = limit;
  if (skip) query.skip = skip;

  Tag.list(query)
    .then(tags => res.json(tags))
    .catch(e => next(e));
}

export default { load, get, list };
