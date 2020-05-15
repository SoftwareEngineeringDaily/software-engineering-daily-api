import isArray from 'lodash/isArray';
import Topic from '../models/topic.model';
import Job from '../models/job.model';
import Post from '../models/post.model';
import User from '../models/user.model';
import { mailTemplate } from '../helpers/mail';

/**
 * @swagger
 * tags:
 * - name: topic
 *   description: Topics info and lists
 */

/**
 * @swagger
 * parameters:
 *   topicId:
 *     name: topicId
 *     in: path
 *     description: Mongo ObjectId of topic
 *     required: true
 *     type: string
 */

async function create(req, res) {
  const { name, maintainer, isUserGenerated } = req.body;

  const exist = await Topic.findOne({ name: new RegExp(name, 'i') });
  if (exist) return res.status(400).send(`A ${name} Topic already exists`);

  const topic = new Topic();

  topic.name = name;
  if (maintainer) topic.maintainers = [maintainer];
  if (isUserGenerated) topic.isUserGenerated = isUserGenerated;

  if (req.body.postId) {
    topic.postCount = 1;
    const topicId = topic._id.toString();
    Post.findByIdAndUpdate(req.body.postId, { $push: { topics: topicId } }, async (err) => {
      if (err) {
        throw err;
      }
    });
  }

  return topic
    .save()
    .then((topicSaved) => {
      res.status(201).json(topicSaved);
    })
    .catch(err => res.status(500).json(err.errmsg));
}

async function add(req, res) {
  const exist = await Topic.findOne({ name: req.body.data.name });
  if (exist) return res.status(400).send(`A ${req.body.data.name} Topic already exists`);
  const topic = new Topic(req.body.data);
  return topic
    .save()
    .then((topicSaved) => {
      res.status(201).json(topicSaved);
    })
    .catch(err => res.status(400).send(err.errmsg));
}

async function get(req, res) {
  const topic = await Topic
    .findById(req.params.topicId)
    .populate('maintainers', 'name lastName email website avatarUrl isAdmin bio');

  res.send(topic);
}

async function getFull(req, res) {
  const topics = await Topic.find()
    .populate('maintainers', 'name lastName email website avatarUrl isAdmin bio');
  res.send(topics);
}

function top(req, res) {
  Topic.find({ status: 'active' }).sort({ postCount: -1 }).limit(parseInt(req.params.count, 10))
    .then((topics) => {
      res.send(topics);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving topics.'
      });
    });
}

async function maintainerInterest(req, res) {
  const admins = await User.find({ isAdmin: true }).lean().exec();

  if (!admins.length) return;

  admins.forEach((admin) => {
    mailTemplate.topicInterest({
      to: admin.email,
      subject: 'New topic publish status',
      data: {
        user: admin.name,
        maintainer: req.body.userName,
        email: req.body.userEmail,
        topic: req.body.topicName,
      }
    });
  });

  res.send('Registered');
}

async function episodes(req, res) {
  const topic = await Topic.findOne({ slug: req.params.slug });
  if (!topic) return res.status(404).send('No topic found');

  const eps = await Post.find({ topics: { $in: [topic._id.toString()] } })
    .select('slug title')
    .sort('-date')
    .lean()
    .exec();

  return res.json({ episodes: eps.slice(0, 10), total: eps.length });
}

async function jobs(req, res) {
  const topic = await Topic.findOne({ slug: req.params.slug });

  if (!topic) return res.status(404).send('No topic found');

  const _jobs = await Job
    .find({
      isDeleted: false,
      topics: {
        $in: [topic._id.toString()]
      }
    })
    .select('slug title')
    .sort('-postedDate')
    .lean()
    .exec();

  return res.json({
    jobs: _jobs.slice(0, 10),
    total: _jobs.length
  });
}

async function createRelatedEpisode(req, res) {
  const { postSlug } = req.body;

  if (!postSlug) return res.status(400).send('Missing data');

  const topic = await Topic.findOne({ slug: req.params.slug });
  if (!topic) return res.status(404).send('No topic found');

  const post = await Post.findOne({ slug: postSlug }).select('topics');
  if (!post) return res.status(404).send('Episode not found');

  // post already has topic
  const existingTopic = post.topics.find(t => t === topic._id.toString());
  if (existingTopic) return res.status(400).send('Episode already has this topic');

  post.topics = post.topics.concat(topic._id.toString());

  try {
    await post.save();
    return res.status(201).end();
  } catch (e) {
    return res.status(500).json(e);
  }
}

async function index(req, res) {
  if (req.query.userId) {
    const user = await User.findById(req.query.userId);

    Topic.find({ _id: { $in: user.topics }, status: 'active' })
      .then((topics) => {
        res.send(topics);
      }).catch((err) => {
        res.status(500).send({
          message: err.message || 'Some error occurred while retrieving topics.'
        });
      });
  } else if (req.query.postId) {
    const post = await Post.findById(req.query.postId);

    Topic.find({ _id: { $in: post.topics }, status: 'active' })
      .then((topics) => {
        res.send(topics);
      }).catch((err) => {
        res.status(500).send({
          message: err.message || 'Some error occurred while retrieving topics.'
        });
      });
  } else {
    Topic.find({ status: 'active' })
      .then((topics) => {
        res.send(topics);
      }).catch((err) => {
        res.status(500).send({
          message: err.message || 'Some error occurred while retrieving topics.'
        });
      });
  }
}

function searchTopics(req, res) {
  const { search } = req.query;
  Topic.find({ name: { $regex: RegExp(`^.*${search}.*$`), $options: 'i' }, status: 'active' })
    .then((topics) => {
      res.send(topics);
    }).catch((err) => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving topics.'
      });
    });
}

function mostPopular(req, res) {
  Topic.find({ status: 'active' }).sort({ postCount: -1 }).limit(10)
    .then((topics) => {
      res.send(topics);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving topics.'
      });
    });
}

function mostPosts(req, res) {
  Topic.find({ status: 'active' }).sort({ postCount: -1 }).limit(40)
    .populate('topicPage', 'published')
    .then((topics) => {
      const result = topics.filter((topic) => {
        return !topic.topicPage || topic.status !== 'active';
      });
      res.send(result.slice(0, 10));
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving topics.'
      });
    });
}

// old, still used in mobile?
function show(req, res) {
  Topic.find({ slug: req.params.slug }, async (err, topic) => {
    if (err) return;
    // const posts = await Post.find({ topics: { $in: [topic[0]._id.toString()] } });

    const {
      limit = null,
      createdAtBefore = null,
      createdAfter = null
    } = req.query;

    const query = {};
    if (limit) query.limit = limit;
    if (createdAtBefore) query.createdAtBefore = createdAtBefore;
    if (createdAfter) query.createdAfter = createdAfter;
    if (isArray(topic) && topic[0] && topic[0]._id) query.topic = [topic[0]._id.toString()];

    const posts = await Post.list(query);

    const body = {
      topic,
      posts
    };
    res.send(body);
  });
}

async function update(req, res) {
  const data = req.body;

  const topic = await Topic.findById(req.params.topicId).lean().exec();

  if (!topic) return res.status(404).send('Topic not found');

  data.maintainers = data.maintainers || [];
  topic.maintainers = topic.maintainers || [];

  return Topic.findByIdAndUpdate(req.params.topicId, { $set: data }, (err) => {
    if (err) {
      return;
    }

    res.send('Topic udpated.');

    data.maintainers.forEach((maintainer) => {
      if (!topic.maintainers.filter(m => m.toString() === maintainer._id).length) {
        mailNewMaintainer(topic, maintainer);
      }
    });
  });
}

async function mailNewMaintainer(topic, maintainerId) {
  const user = await User.findById(maintainerId);

  if (!user) return;

  const topicLink = `http://softwaredaily.com/topic/${topic.slug}/edit`;

  const send = mailTemplate.topicMaintainer({
    to: user.email,
    subject: 'New topic maintainer!',
    data: { user: user.name, topic: topic.name, topicLink }
  });

  if (!send) {
    console.error('[mailTemplate] Send e-mail failed!'); // eslint-disable-line
  }
}

async function deleteTopic(req, res) {
  const { user } = req.body;
  const userById = await User.findOne({ _id: [user.id] });

  if (userById && userById.isAdmin) {
    Topic.findByIdAndUpdate(req.params.id, { $set: { status: 'deleted' } }, (err) => {
      if (err) return;
      res.send('Topic deleted.');
    });
  } else {
    res.send('Only admin can delete topic.');
  }
}

async function addTopicsToUser(req, res) {
  try {
    const { topics } = req.body;
    const { userId } = req.body;

    if (userId) {
      const user = await User.findById(userId);

      const filteredTopics = [];
      topics.map((t) => {
        if (!user.topics.includes(t)) {
          filteredTopics.push(t);
        }
        return filteredTopics;
      });
      const removeTopics = [];
      user.topics.map((t) => {
        if (!topics.includes(t)) {
          removeTopics.push(t);
        }
        return removeTopics;
      });
      User.findByIdAndUpdate(
        userId,
        {
          $push: {
            topics: { $each: filteredTopics }
          }
        }, async (err) => {
          if (err) return;
          User.findByIdAndUpdate(
            userId,
            {
              $pull: {
                topics: { $in: removeTopics }
              }
            }, async (error) => {
              if (error) return;
              res.send('Topic added.');
            }
          );
        }
      );
    }
  } catch (e) {
    res.status(400).send('error');
  }
}

async function addTopicsToPost(req, res) {
  try {
    const { postId } = req.body;
    const { topics } = req.body;

    if (postId) {
      const post = await Post.findById(postId);

      const filteredTopics = [];
      topics.map((t) => {
        if (!post.topics.includes(t)) {
          filteredTopics.push(t);
        }
        return filteredTopics;
      });

      const removeTopics = [];
      post.topics.map((t) => {
        if (!topics.includes(t)) {
          removeTopics.push(t);
        }
        return removeTopics;
      });
      Post.findByIdAndUpdate(
        postId,
        {
          $push: {
            topics: { $each: filteredTopics }
          }
        }, async (err) => {
          if (err) return;
          filteredTopics.map((topicId) => {
            Topic.findByIdAndUpdate(topicId, {
              $inc: { postCount: 1 }
            }, (error) => {
              if (error) throw error;
            });
            return true;
          });
          Post.findByIdAndUpdate(
            postId,
            {
              $pull: {
                topics: { $in: removeTopics }
              }
            }, async (error) => {
              if (error) return;
              removeTopics.map((topicId) => {
                Topic.findByIdAndUpdate(topicId, {
                  $inc: { postCount: -1 }
                }, (removeTopicError) => {
                  if (removeTopicError) throw removeTopicError;
                });
                return true;
              });
            }
          );
          res.send('Topic added.');
        }
      );
    } else {
      res.status(400).send('postId is necessary.');
    }
  } catch (e) {
    res.status(400).send(e);
  }
}

/**
  * @swagger
  * /topics:
  *   post:
  *     summary: Create new topic
  *     description: Create new topic by current user.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *   get:
  *     summary: Get topics index
  *     description: Get list of topics. If user_id exist in query params return topics by user_id.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *
  * /topics/addTopicToUser:
  *   post:
  *     summary: Add topic to user
  *     description: Adds topic to topics array at user document.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *
  * /topics/{topicId}:
  *   get:
  *     summary: Get topic
  *     description: Get topic by id.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *   update:
  *     summary: Update topic
  *     description: Update topic by id.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *   delete:
  *     summary: Delete topic
  *     description: Delete topic by id. Need user.id in req.body to check if the user is an admin.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *
  */

export default {
  add,
  get,
  getFull,
  top,
  maintainerInterest,
  create,
  episodes,
  jobs,
  createRelatedEpisode,
  index,
  mostPopular,
  mostPosts,
  show,
  update,
  deleteTopic,
  addTopicsToUser,
  addTopicsToPost,
  searchTopics
};
