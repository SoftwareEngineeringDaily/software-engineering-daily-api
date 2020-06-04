import uniq from 'lodash/uniq';
import find from 'lodash/find';
import flatten from 'lodash/flatten';
import algoliasearch from 'algoliasearch';
import Post from '../models/post.model';
import Topic from '../models/topic.model';
import {
  addPostData,
  getAdFreePostsIfSubscribed,
} from '../helpers/post.helper';

async function populateTopics(posts) {
  const _topics = uniq(flatten(posts.map(p => p.topics.map(id => id.toString()))));
  const topics = await Topic.find({ _id: { $in: _topics } });

  return posts.map((post) => {
    post.topics = post.topics // eslint-disable-line no-param-reassign
      .map((topicId) => {
        return find(topics, { id: topicId.toString() });
      })
      .filter(t => !!(t));

    return post;
  });
}

/**
 * @swagger
 * tags:
 * - name: post
 *   description: Podcast Episode (post) Information
 */

/**
 * @swagger
 * parameters:
 *   postId:
 *     name: postId
 *     in: path
 *     description: Mongo ObjectId of episode/post
 *     required: true
 *     type: string
 */

function load(req, res, next, id) {
  Post.get(id)
    .then((post) => {
      req.post = post; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * @swagger
 * /posts/{postId}:
 *   get:
 *     summary: Get episode by ID
 *     description: Get episode by ID
 *     tags: [post]
 *     security: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Post'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */

async function get(req, res, next) {
  req.response = await addPostData(
    req.post.toObject(),
    req.fullUser,
    next
  );

  req.topicIds = req.response.topics || [];

  return next();
}

/**
 * @swagger
 * /posts/popular:
 *   get:
 *     summary: Get posts by score
 *     description: Get posts by score
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           $ref: '#/definitions/Post'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */

async function popular(req, res) {
  try {
    const posts = await Post
      .find()
      .limit(parseInt(req.query.limit || 5, 10))
      .sort('-score');

    return res.json({ posts });
  } catch (err) {
    return res.status(404).json({ message: err.message || err.toString() });
  }
}

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get list of episodes
 *     description: Get list of most recent episodes. Use query paramters to filter results.
 *     tags: [post]
 *     security: [] #indicates no authorization required to use route
 *     parameters:
 *       - $ref: '#/parameters/limit'
 *       - in: query
 *         name: createdAtBefore
 *         type: string
 *         format: date-time #All date-time format follow https://xml2rfc.tools.ietf.org/public/rfc/html/rfc3339.html#anchor14
 *         required: false
 *         description: |
 *           The date/time the episode was created at or before,
 *           if not set ten latest episodes will be returned relative to current date
 *       - in: query
 *         name: createdAfter
 *         type: string
 *         format: date-time
 *         required: false
 *         description: The date/time the episode was created after
 *       - in: query
 *         name: transcripts
 *         type: boolean
 *         required: false
 *         description: |
 *            Using true returns posts with a transcriptUrl field,
 *            using false returns posts without
 *       - in: query
 *         name: type
 *         type: string
 *         required: false
 *         description: The type of episode
 *         enum: [new, top]
 *       - in: query
 *         name: search
 *         type: string
 *         required: false
 *         description: Search pattern for episode text
 *       - in: query
 *         name: tags
 *         type: array
 *         required: false
 *         collectionFormat: csv
 *         items:
 *           type: string
 *         description: Episode tag
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Post'
 */

function list(req, res, next) {
  const {
    limit = null,
    createdAtBefore = null,
    createdAfter = null,
    type = null,
    tags = null,
    categories = null,
    search: _search = null,
    transcripts = null,
    topic = null
  } = req.query;

  const query = {};

  if (limit) query.limit = limit;
  if (createdAtBefore) query.createdAtBefore = createdAtBefore;
  if (createdAfter) query.createdAfter = createdAfter;
  if (type) query.type = type;
  if (req.user) query.user = req.user;
  if (_search) query.search = _search;
  if (transcripts) query.transcripts = transcripts;

  if (tags) {
    query.tags = tags.split(',');
    let newTags = []; //eslint-disable-line
    query.tags.forEach((tag) => {
      newTags.push(parseInt(tag, 10));
    });
    query.tags = newTags;
  }

  if (categories) {
    query.categories = categories.split(',');
    let newTags = []; //eslint-disable-line
    query.categories.forEach((tag) => {
      newTags.push(parseInt(tag, 10));
    });
    query.categories = newTags;
  }

  if (topic) {
    query.topic = [topic];
  }

  Post.list(query)
    .then(async (posts) => {
      const response = await getAdFreePostsIfSubscribed(posts, req.fullUser, next);

      req.posts = req.posts.concat(response);
      req.posts.sort((a, b) => b.date - a.date);
      req.posts = await populateTopics(req.posts || []);

      return res.json(req.posts);
    })
    .catch(e => next(e));
}

// @TODO: maybe this should be in a recommendation controller

/**
 * @swagger
 * /recommendations:
 * get:
 *   summary: Get list of recommended episodes
 *   description: Get list of recommended episodes for authorized user
 *   tags: [post]
 *   security:
 *     - Token: []
 *   responses:
 *     '200':
 *       description: successful operation
 *       schema:
 *         type: array
 *         items:
 *           $ref: '#/definitions/Post'
 *     '401':
 *       $ref: '#/responses/Unauthorized'
 *     '404':
 *       $ref: '#/responses/NotFound'
 */

function recommendations(req, res) {
  // Raccoon recommendations were removed, so we return empty list for now
  res.json([]);
}

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Make algolia search request
 *     description: Get posts based on algolia search query
 *     tags: [post]
 *     security: [] #indicates no authorization required to use route
 *     parameters:
 *       - $ref: '#/parameters/limit'
 *       - in: query
 *         name: query
 *         type: string
 *         format: date-time #All date-time format follow https://xml2rfc.tools.ietf.org/public/rfc/html/rfc3339.html#anchor14
 *         required: false
 *         description: search term
 *       - in: query
 *         name: page
 *         type: integer
 *         format: int64
 *         required: true
 *         description: search page number
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Post'
 */

function search(req, res, next) {
  let isEnd = false;
  let nextPage = 0;
  let slugs = [];

  const { query = '' } = req.query;
  const page = parseInt(req.query.page || '0', 10);

  const client = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_API_KEY,
  );

  const index = client.initIndex(process.env.ALGOLIA_POSTS_INDEX);
  const searchQuery = {
    query,
    page,
    hitsPerPage: 10,
  };

  index.search(searchQuery)
    .then((reply) => {
      nextPage = (page >= reply.nbPages) ? reply.nbPages : page + 1;
      isEnd = (nextPage === reply.nbPages);
      slugs = reply.hits.map(h => h.slug);

      Post.find({ slug: { $in: slugs } })
        .then(async (posts) => {
          posts = await getAdFreePostsIfSubscribed(posts, req.fullUser, next); // eslint-disable-line
          posts = await populateTopics(posts || []); // eslint-disable-line no-param-reassign

          res.json({ posts, isEnd, nextPage });
        })
        .catch(e => next(e));
    })
    .catch(e => next(e));
}

function upvote(req, res, next) {
  // Raccoon recommendations were removed, vote logic moved to vote controller
  next();
}

function downvote(req, res, next) {
  // Raccoon recommendations were removed, vote logic moved to vote controller
  next();
}

async function getRelatedEpisodes(req, res) {
  let post = await Post.findById(req.params.postId)
    .populate('relatedPosts', 'slug title score');

  if (!post) return res.json([]);

  post = post.toObject();

  const topics = uniq(post.topics);
  let _relatedPosts = [];
  const relatedPosts = [];

  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < topics.length; i += 1) {
    const posts = await Post.find({ topics: { $in: [topics[i]] }, _id: { $ne: post._id } })
      .select('slug title score')
      .sort('-score -date')
      .limit(3)
      .lean();

    _relatedPosts = _relatedPosts.concat(posts);
  }

  _relatedPosts.forEach((r) => {
    r.userGenerated = false; // eslint-disable-line no-param-reassign
    if (!relatedPosts.map(p => p._id.toString()).includes(r._id.toString())) relatedPosts.push(r);
  });

  relatedPosts.sort((a, b) => {
    if (b) return b.score - a.score;
    return 1;
  });

  // from saved by users
  post.relatedPosts.forEach((r) => {
    r.userGenerated = true; // eslint-disable-line no-param-reassign
    if (!relatedPosts.map(p => p._id.toString()).includes(r._id.toString())) relatedPosts.push(r);
  });

  return res.json(relatedPosts);
}

async function saveRelatedEpisode(req, res) {
  const { post, params: { episodeSlug } } = req;

  if (!episodeSlug) return res.status(400).end('Missing data');

  const newPost = await Post.findOne({ slug: episodeSlug }).select('slug');

  if (!newPost) return res.status(404).end('Post not found');

  if (post.relatedPosts.find(id => id.toString() === newPost._id.toString())) {
    return res.status(400).end('Episode already included');
  }

  post.relatedPosts = post.relatedPosts.concat([newPost._id]);

  await post.save();

  return res.status(201).end();
}

async function deleteRelatedEpisode(req, res) {
  const { post, params: { episodeSlug } } = req;

  if (!episodeSlug) return res.status(400).end('Missing data');

  const removePost = await Post.findOne({ slug: episodeSlug }).select('_id');

  if (!removePost) return res.status(404).end('Post not found');

  post.relatedPosts = post.relatedPosts.filter(p => p.toString() !== removePost._id.toString());

  await post.save();

  return res.status(200).end();
}

async function updateTopics(req, res) {
  const { post, body: { topics } } = req;

  if (!topics) return res.status(400).end('Missing data');

  const createTopics = topics.filter(t => !t._id);
  const newTopics = topics.filter(t => t._id);

  if (newTopics.length) {
    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < createTopics.length; i += 1) {
      const exist = await Topic.findOne({ name: new RegExp(createTopics[i].name, 'i') });
      if (exist) {
        newTopics.push(exist);
      } else {
        const topic = new Topic({ name: createTopics[i].name, isUserGenerated: true });
        const saved = await topic.save();
        newTopics.push(saved);
      }
    }
  }

  post.topics = newTopics.map(t => t._id.toString());

  await post.save();

  return res.json(newTopics);
}

export default {
  load,
  get,
  popular,
  list,
  search,
  recommendations,
  downvote,
  upvote,
  getRelatedEpisodes,
  saveRelatedEpisode,
  deleteRelatedEpisode,
  updateTopics
};
