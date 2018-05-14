// import httpStatus from 'http-status';
// import APIError from '../helpers/APIError';
// import FeedItem from '../models/feedItem.model';
import { getThreads } from '../helpers/forum.helper';

async function list(req, res, next) {
  // How about for logged out users?
  // -- just get the most recent related links?
  try {
    // We get our feed Items for this user:
    const threads = await getThreads(req);
    res.json(threads);
    // We get the most recent forum threads.
    // We comebine these:
  } catch (e) {
    next(e);
  }
}


async function listProfileFeed(/* req, res, next */) {
  // const { userId } = req.params;
}

export default { list, listProfileFeed };
