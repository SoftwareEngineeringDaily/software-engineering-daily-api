// import httpStatus from 'http-status';
// import APIError from '../helpers/APIError';
import FeedItem from '../models/feedItem.model';
import { getThreads } from '../helpers/forum.helper';

async function list(req, res, next) {
  // How about for logged out users?
  // -- just get the most recent related links?
  try {
    // We get our feed Items for this user:
    const threads = await getThreads(req);

    const {
      lastActivityBefore = null
    } = req.query;
    // This is to paginate forum threads which does not apply to items
    const items = lastActivityBefore ? [] : await getLinks(req);
    // We get the most recent forum threads.
    // We comebine these:
    // res.json(items.concat(threads));
    res.json(interweaveArrays(threads, items));
  } catch (e) {
    next(e);
  }
}
async function getLinks(req) {
  const query = {};
  if (req.user) query.user = req.user;

  const {
    limit = 10,
  } = req.query;

  query.limit = limit;
  const items = await FeedItem.list(query);
  return items;
}


function interweaveArrays(a1, a2) {
  let array1 = [];
  let array2 = [];
  if (a1.length > a2.length) {
    array1 = a1;
    array2 = a2;
  } else {
    array1 = a2;
    array2 = a1;
  }
  return array1.map((v, i) =>
    [v, array2[i]]).reduce((a, b) =>
    a.concat(b)).filter((a) => {
    console.log('');
    return a != null;
  });
}

async function listProfileFeed(/* req, res, next */) {
  // const { userId } = req.params;
}

export default { list, listProfileFeed };
