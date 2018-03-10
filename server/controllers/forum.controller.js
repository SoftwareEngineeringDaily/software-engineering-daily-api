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
  /*
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
    .then(threads => res.json(threads))
    .catch(e => next(e));
  */
  ForumThread.list()
    .then(threads => res.json(threads))
    .catch(e => next(e));
}

function detail() {
}

function create(req, res, next) {
  const forumThread = new ForumThread();
  const { title, content, } = req.body;
  const { user } = req;
  forumThread.title = title;
  forumThread.content = content;
  forumThread.author = user._id;

  forumThread
    .save()
    .then((forumThreadSaved) => {
      res.status(201).json(forumThreadSaved);
    })
    .catch(err => next(err));
}

function update() {
}

function remove(req, res, next) {
  const { forumThread, user } = req;
  if (forumThread && user) {
    if (forumThread.author.toString() !== user._id.toString()) {
      return res.status(401).json({ Error: 'Please login' });
    }
    forumThread.deleted = true;
    return forumThread
      .save()
      .then(() => {
        // Sucess:
        res.json({ deleted: true });
      })
      .catch((e) => {
        next(e);
      });
  }
  return res.status(500).json({});
}

export default {
  load,
  list,
  detail,
  create,
  update,
  remove
};
