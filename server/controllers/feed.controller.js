// import httpStatus from 'http-status';
// import APIError from '../helpers/APIError';
// import FeedItem from '../models/feedItem.model';
import ForumThread from '../models/forumThread.model';

async function list(req, res, next) {
  // How about for logged out users?
  // -- just get the most recent related links?

  const query = {};
  if (req.user) query.user = req.user;

  const {
    limit = null,
    lastActivityBefore = null
  } = req.query;

  if (limit) query.limit = limit;
  if (lastActivityBefore) query.lastActivityBefore = lastActivityBefore;
  try {
    const threads = await ForumThread.list(query);
    res.json(threads);
  } catch (e) {
    next(e);
  }
  // We get our feed Items for this user:

  // We get the most recent forum threads.
}

async function listProfileFeed(req, res, next) {
  // const { userId } = req.params;

  const query = {};
  if (req.user) query.user = req.user;

  const {
    limit = null,
    lastActivityBefore = null
  } = req.query;

  if (limit) query.limit = limit;
  if (lastActivityBefore) query.lastActivityBefore = lastActivityBefore;
  try {
    const threads = await ForumThread.list(query);
    res.json(threads);
  } catch (e) {
    next(e);
  }
}

export default { list, listProfileFeed };
