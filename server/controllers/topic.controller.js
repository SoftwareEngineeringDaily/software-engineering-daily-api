import Topic from '../models/topic.model';
import Post from '../models/post.model';
import User from '../models/user.model';

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
  const topic = new Topic();
  topic.name = req.body.name;

  if (req.body.postId) {
    topic.postCount = 1;
    const topicId = topic._id.toString();
    Post.findByIdAndUpdate(req.body.postId, { $push: { topics: topicId } }, async (err) => {
      if (err) {
        throw err;
      }
    });
  }

  topic
    .save()
    .then((topicSaved) => {
      res.status(201).json(topicSaved);
    })
    .catch(err => res.status(422).json(err.errmsg));
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
    if (topic) query.topic = [topic[0]._id.toString()];

    const posts = await Post.list(query);

    const body = {
      topic,
      posts
    };
    res.send(body);
  });
}

function update(req, res) {
  Topic.findByIdAndUpdate(req.params.id, { $set: req.body }, (err) => {
    if (err) return;
    res.send('Topic udpated.');
  });
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
  create,
  index,
  mostPopular,
  show,
  update,
  deleteTopic,
  addTopicsToUser,
  addTopicsToPost,
  searchTopics
};
