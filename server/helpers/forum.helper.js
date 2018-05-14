import ForumThread from '../models/forumThread.model';

async function getThreads(req) {
  const query = {};
  if (req.user) query.user = req.user;

  const {
    limit = 15,
    lastActivityBefore = null
  } = req.query;

  query.limit = limit;
  if (lastActivityBefore) query.lastActivityBefore = lastActivityBefore;
  const threads = await ForumThread.list(query);
  return threads;
}

export default { getThreads };
