import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Feed from '../models/feed.model';
import RelatedLink from '../models/relatedLink.model';

function list(req, res, next) {
  // If user is logged out, use a random feed

  const query = req.user ? { user: req.user._id } : {};

  // eslint-disable-next-line
  console.log('--------query', query);
  Feed.findOne(query)
    .exec()
    .then((feed) => {
      // If user is new and doesn't have a feed, use any feed:
      if (feed == null) {
        Feed.findOne()
          .exec()
          .then((randomFeed) => {
            if (randomFeed) {
              res.json(randomFeed.feedItems);
            } else {
              res.json([]);
            }
          })
          .catch(() => {
            const err = new APIError(
              'Error fetching Jeffs feed',
              httpStatus.INTERNAL_SERVER_ERROR,
              true
            ); //eslint-disable-line
            return next(err);
          });
      } else {
        res.json(feed.feedItems);
      }
    })
    .catch(() => {
      const err = new APIError('Error fetching user feed', httpStatus.INTERNAL_SERVER_ERROR, true); //eslint-disable-line
      return next(err);
    });
}

function listProfileFeed(req, res, next) {
  const { userId } = req.params;
  RelatedLink.listProfileFeed({ userId })
    .then((relatedLinks) => {
      if (!relatedLinks) {
        return res.json([]);
      }
      return res.json(relatedLinks);
    })
    .catch(() => {
      const err = new APIError(
        'Error fetching profile feed',
        httpStatus.INTERNAL_SERVER_ERROR,
        true
      ); //eslint-disable-line
      return next(err);
    });
}

export default { list, listProfileFeed };
