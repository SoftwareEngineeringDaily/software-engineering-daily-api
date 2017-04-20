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
 * Create new vote
 * @property {string} req.body.votename - The votename of vote.
 * @property {string} req.body.mobileNumber - The mobileNumber of vote.
 * @returns {Vote}
 */
function create(req, res, next) {
  const vote = new Vote({
    votename: req.body.votename,
    mobileNumber: req.body.mobileNumber
  });

  vote.save()
    .then(savedVote => res.json(savedVote))
    .catch(e => next(e));
}

/**
 * Update existing vote
 * @property {string} req.body.votename - The votename of vote.
 * @property {string} req.body.mobileNumber - The mobileNumber of vote.
 * @returns {Vote}
 */
function update(req, res, next) {
  const vote = req.vote;
  vote.votename = req.body.votename;
  vote.mobileNumber = req.body.mobileNumber;

  vote.save()
    .then(savedVote => res.json(savedVote))
    .catch(e => next(e));
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

/**
 * Delete vote.
 * @returns {Vote}
 */
function remove(req, res, next) {
  const vote = req.vote;
  vote.remove()
    .then(deletedVote => res.json(deletedVote))
    .catch(e => next(e));
}

export default { load, get, create, update, list, remove };
