import Post from '../models/post.model';
import Like from '../models/like.model';

/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  Post.get(id)
    .then((user) => {
      req.user = user; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get user
 * @returns {Post}
 */
function get(req, res) {
  return res.json(req.user);
}

/**
 * Create new user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {Post}
 */
function create(req, res, next) {
  const user = new Post({
    username: req.body.username,
    mobileNumber: req.body.mobileNumber
  });

  user.save()
    .then(savedPost => res.json(savedPost))
    .catch(e => next(e));
}

/**
 * Update existing user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {Post}
 */
function update(req, res, next) {
  const user = req.user;
  user.username = req.body.username;
  user.mobileNumber = req.body.mobileNumber;

  user.save()
    .then(savedPost => res.json(savedPost))
    .catch(e => next(e));
}

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {Post[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0, createdAtBefore = null } = req.query;

  let query = { limit };
  if (createdAtBefore) query.createdAtBefore = createdAtBefore;

  Post.list(query)
    .then(users => res.json(users))
    .catch(e => next(e));
}

/**
 * Delete user.
 * @returns {Post}
 */
function remove(req, res, next) {
  const user = req.user;
  user.remove()
    .then(deletedPost => res.json(deletedPost))
    .catch(e => next(e));
}

/**
 * Like a post
 */
function like(req, res, next, id) {
  Like.findOne({
    postId: id,
    userId: req.user._id,
  })
  .then((like) => {
    if (like) {
      like.active = !like.active;

      if (like.active) {
        // raccoon.liked('userId', 'itemId')
      } else {
        // raccoon.unliked('userId', 'itemId')
      }

      return like;
    }

    let newlike = new Like();
    newlike.postId = id;
    newlike.userId = req.user._id;
    newlike.type = 'upvote'; // @TODO: Make constant

    // raccoon.liked('userId', 'itemId')

    return newlike.save();
  })
  .then((like) => {
    req.like = like; // eslint-disable-line no-param-reassign
    return next();
  })
  .catch(e => next(e));
}

export default { load, get, create, update, list, remove, like };
