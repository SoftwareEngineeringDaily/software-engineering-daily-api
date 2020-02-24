import request from 'request';
import { getMetadata } from 'page-metadata-parser';
import jsdom from 'jsdom';
import RelatedLink from '../models/relatedLink.model';

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

function create(req, res, next) {
  const { user } = req;
  const { postId } = req.params;
  const { url, type = 'link' } = req.body;

  request(url, { timeout: 15000 }, (error, reply) => {
    // If there's an error or nothing
    // let's remember that
    if (error || !reply.body || reply.statusCode !== 200) {
      return next(error);
    }

    const { body } = reply;
    const { document } = (new JSDOM(body)).window;
    const relatedLink = new RelatedLink();
    const metadata = getMetadata(document, url);

    relatedLink.url = url;
    relatedLink.title = metadata.title || 'Related Link';
    relatedLink.type = type;
    relatedLink.post = postId;
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
