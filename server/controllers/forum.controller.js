import ForumThread from '../models/forumThread.model';

function load(req, res, next, id) {
  ForumThread.get(id)
    .then((forumThread) => {
      req.forumThread = forumThread; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

function list(req, res, next) {
  const {
    limit = null,
    createdAtBefore = null,
    createdAfter = null,
    search = null
  } = req.query;

  const query = {};
  if (limit) query.limit = Math.min(limit, 500);
  if (createdAtBefore) query.createdAtBefore = createdAtBefore;
  if (createdAfter) query.createdAfter = createdAfter;
  if (search) query.search = search;

  ForumThread.list(query)
    .then(posts => res.json(posts))
    .catch(e => next(e));
}

function detail() {
}

function create(req, res, next) {
  const forumThread = new ForumThread();
  forumThread
    .save()
    .then((forumThreadSaved) => {
      res.status(201).json(forumThreadSaved);
    })
    .catch(err => next(err));
}

function update() {
}

function remove() {
}

export default {
  load,
  list,
  detail,
  create,
  update,
  remove
};
