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
  const query = {};
  if (req.user) query.user = req.user;
  ForumThread.list(query)
    .then(threads => res.json(threads))
    .catch(e => next(e));
}

function detail(req, res) {
  return res.json(req.forumThread);
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

function update(req, res, next) {
  const {
    forumThread, user, content, title
  } = req;
  if (forumThread && forumThread.author && forumThread.author._id && user) {
    if (forumThread.author._id.toString() !== user._id.toString()) {
      return res.status(401).json({ Error: 'Please login' });
    }
    forumThread.content = content;
    forumThread.title = title;
    forumThread.dateLastEdited = Date();
    return forumThread
      .save()
      .then((editedThread) => {
        // Sucess:
        res.json(editedThread);
      })
      .catch((e) => {
        next(e);
      });
  }
  return res.status(500).json({});
}

function remove(req, res, next) {
  const { forumThread, user } = req;
  // TODO: if admin should be able to delete too
  if (forumThread && forumThread.author && forumThread.author._id && user) {
    if (forumThread.author._id.toString() !== user._id.toString()) {
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
