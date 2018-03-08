import ForumThread from '../models/forumThread.model';

function load(req, res, next, id) {
  ForumThread.get(id)
    .then((forumThread) => {
      req.forumThread = forumThread; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}


function list() {
}
function detail() {
}

function create() {
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
