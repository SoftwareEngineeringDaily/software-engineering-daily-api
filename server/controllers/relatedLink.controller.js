import request from 'request';
import { getMetadata } from 'page-metadata-parser';
import jsdom from 'jsdom';
import RelatedLink from '../models/relatedLink.model';
import TopicPage from '../models/topicPage.model';
import Topic from '../models/topic.model';

const { JSDOM } = jsdom;

/**
 * @swagger
 * tags:
 * - name: relatedLink
 *   description: Related links for episodes.
 */

/*
* Load comment and append to req.
*/
function load(req, res, next, id) {
  RelatedLink.findById(id)
    .then((relatedLink) => {
      req.relatedLink = relatedLink; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(error => next(error));
}

function remove(req, res, next) {
  const { relatedLink, user } = req;
  if (relatedLink && user) {
    if (relatedLink.author.toString() !== user._id.toString()) {
      return res.status(401).json({ Error: 'Please login' });
    }
    relatedLink.deleted = true;
    if (!relatedLink.title) {
      // For old links :/
      relatedLink.title = relatedLink.url;
    }
    return relatedLink
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

/**
 * @swagger
 * /posts/{postId}/relatedLink:
 *   post:
 *     summary: Create relatedLink for episode
 *     description: Create relatedLink for episode
 *     tags: [relatedLink]
 *     security:
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *       - in: body
 *         name: URL
 *         type: string
 *         required: true
 *         description: URL for link
 *     responses:
 *       '201':
 *         description: successful created
 *         schema:
 *              $ref: '#/definitions/RelatedLink'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */

async function create(req, res, next) {
  const { user } = req;
  const { postId, slug } = req.params;
  const { url, type = 'link' } = req.body;
  const options = {
    url,
    timeout: 15000,
    headers: {
      'User-Agent': 'googlebot',
    }
  };

  let topic;
  let topicPage;
  let entityType = 'post';
  if (slug) {
    topic = await Topic.findOne({ slug }).lean();
    topicPage = await TopicPage.findOne({ topic: topic._id }).lean();
    entityType = 'topic';
  }

  request(options, (error, reply, body) => {
    if (error || !body || reply.statusCode !== 200) {
      return next(error);
    }

    const { document } = (new JSDOM(body)).window;
    const relatedLink = new RelatedLink();
    const metadata = getMetadata(document, url);

    relatedLink.url = url;
    relatedLink.title = metadata.title || url;
    relatedLink.type = type;
    relatedLink.entityType = entityType;
    relatedLink.post = postId || undefined;
    relatedLink.topicPage = (topicPage) ? topicPage._id : undefined;
    relatedLink.author = user._id;

    if (metadata.icon) {
      relatedLink.icon = metadata.icon;
    }

    return relatedLink
      .save()
      .then(relatedLink1 => res.status(201).json(relatedLink1))
      .catch(err => next(err));
  });
}

function list(req, res, next) {
  const { postId } = req.params;
  RelatedLink.list({ post: postId, user: req.user })
    .then((relatedLinks) => {
      res.json(relatedLinks);
    })
    .catch(err => next(err));
}

export default {
  create,
  list,
  load,
  remove
};
