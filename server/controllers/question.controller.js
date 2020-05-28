import async from 'async';
import find from 'lodash/find';
import isArray from 'lodash/isArray';
import shuffle from 'lodash/shuffle';
import Question from '../models/question.model';
import Topic from '../models/topic.model';
import topicPageCtrl from './topicPage.controller';
import { saveAndNotifyUser } from './notification.controller';
import { mailTemplate } from '../helpers/mail';

async function get(req, res) {
  const question = await Question.findById(req.params.id).populate('answers');

  if (!question) return res.status(404).send('Not found');

  question.answers.sort((o1, o2) => {
    return o1.votes.length >= o2.votes.length ? -1 : 1;
  });

  return res.json(question.toObject());
}

async function getUnanswered(req, res) {
  let questions = await Question
    .find({
      answers: { $size: 0 },
      $or: [
        { deleted: false },
        { deleted: { $exists: false } },
      ],
    })
    .populate('author', 'name lastName email website avatarUrl bio');

  if (!questions) {
    return res.status(404).send('Not found');
  }

  questions = shuffle(questions)
    .slice(0, parseInt(req.params.limit || 10, 10));

  const topicIds = questions.map(q => q.entityId);
  let topics = await Topic.find({ _id: { $in: topicIds } });

  topics = topics
    .map(t => ({
      ...t.toObject(),
      _id: t._id.toString(),
    }));

  questions = questions.map(q => ({
    topic: find(topics, { _id: q.entityId }),
    ...q.toObject(),
  }));

  return res.json(questions);
}

async function create(req, res) {
  const {
    entityId, entityType, content, questions
  } = req.body;

  if (!entityId || !entityType || (!content && !questions)) {
    return res.status(400).send('Missing data');
  }

  const author = req.user._id;
  const series = [];
  const saved = [];
  let saveQuestions = [];
  const topic = await Topic
    .findOne({ _id: entityId })
    .populate('maintainers');

  if (content) {
    saveQuestions.push(content.trim());
  }
  if (questions) {
    saveQuestions = questions.filter(q => !!q);
  }

  saveQuestions.forEach((questionContent) => {
    series.push((callback) => {
      const question = new Question({
        author,
        entityId,
        entityType,
        content: questionContent.trim()
      });

      question.save()
        .then((dbQuestion) => {
          saved.push(dbQuestion);
          callback();
        })
        .catch(callback);
    });
  });

  return async.series(series, (err) => {
    if (err) {
      return res.status(500).end(err.message ? err.message : err.toString());
    }

    if (entityType === 'topic') {
      topicPageCtrl.createTopicPage(entityId);
    }

    // Handle notifications
    topic.maintainers = topic.maintainers || [];
    topic.maintainers.forEach((maintainer) => {
      const canSend = (
        maintainer &&
        req.user &&
        maintainer.email &&
        maintainer.email !== req.user.email
      );

      const qCount = (saveQuestions.length);
      const payload = {
        notification: {
          title: `${qCount > 1 ? `${qCount} ` : ''}New question${qCount > 1 ? 's' : ''} asked about ${topic.name}`,
          body: saveQuestions[0],
          data: {
            user: req.user.username,
            mentioned: maintainer._id,
            slug: topic.slug,
            url: `/topic/${topic.slug}/question/${saved[0]._id}`,
          }
        },
        type: 'question',
        entity: topic._id
      };

      if (canSend) {
        // notify maintainer
        saveAndNotifyUser(payload, maintainer._id);

        // email maintainer
        mailTemplate.topicQuestion({
          to: maintainer.email,
          subject: 'New question',
          data: {
            user: maintainer.name,
            topic: topic.name,
            actionLabel: qCount > 1 ? 'Go to topic' : 'Review question',
            actionLink: `http://softwaredaily.com/topic/${topic.slug}${qCount > 1 ? '' : `/question/${saved[0]._id}`}`,
            questions: saveQuestions,
          }
        });
      }
    });

    return res.json(saved.length === 1 ? saved[0] : saved);
  });
}

async function getByEntity(req, res) {
  const { entityType, entityId } = req.params;
  const questions = await Question
    .find({
      entityType,
      entityId,
      $or: [{ deleted: false }, { deleted: { $exists: false } }]
    })
    .populate({
      path: 'answers',
      populate: {
        path: 'author',
        select: 'name lastName avatarUrl twitter',
        where: { $or: [{ deleted: false }, { deleted: { $exists: false } }] }
      }
    })
    .exec();

  questions.forEach((question) => {
    question.answers.sort((o1, o2) => {
      return o1.votes.length >= o2.votes.length ? -1 : 1;
    });
  });

  questions.sort((a, b) => {
    return (b.answers.length === a.answers.length)
      ? a.dateCreated - b.dateCreated
      : b.answers.length - a.answers.length;
  });

  return res.json(questions);
}

async function update(req, res) {
  const { fullUser: user } = req;
  const question = await Question.findById(req.params.id);

  if (!question) return res.status(404).send('Not found');

  if (question.author &&
    (!user._id || !user.isAdmin || user._id.toString() !== question.author.toString())) {
    return res.status(401).send('Not enough permissions to modify question');
  }

  if (!question.author && !user.isAdmin) {
    return res.status(401).send('Not enough permissions to modify question');
  }

  Object.keys(req.body).forEach((key) => {
    question[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
  });

  question.dateUpdated = new Date();

  try {
    const saved = await question.save();
    return res.json(saved.toObject());
  } catch (e) {
    return res.status(500).end(e.message ? e.message : e.toString());
  }
}

async function deleteQuestion(req, res) {
  const { fullUser: user } = req;
  const question = await Question.findById(req.params.id);

  if (!question) return res.status(404).send('Not found');

  if (question.author &&
    (!user._id || !user.isAdmin || user._id.toString() !== question.author.toString())) {
    return res.status(401).send('Not enough permissions to modify question');
  }

  if (!question.author && !user.isAdmin) {
    return res.status(401).send('Not enough permissions to modify question');
  }

  question.deleted = true;
  question.dateUpdated = new Date();

  try {
    const saved = await question.save();
    return res.json(saved.toObject());
  } catch (e) {
    return res.status(500).end(e.message ? e.message : e.toString());
  }
}

async function getRelated(req, res, next) {
  if (!isArray(req.topicIds)) {
    return next();
  }

  const questions = await Question
    .find({
      entityId: { $in: req.topicIds },
      $or: [
        { deleted: false },
        { deleted: { $exists: false } },
      ],
    })
    .sort('-dateUpdated')
    .populate(['answers'])
    .limit(20);

  questions.forEach((question) => {
    question.answers.sort((a, b) => b.votes.length - a.votes.length);
  });

  questions.sort((a, b) => {
    return (b.answers.length === a.answers.length)
      ? b.dateCreated - a.dateCreated
      : b.answers.length - a.answers.length;
  });

  req.response = req.response || {};
  req.response.questions = questions.slice(0, 10);

  return next();
}

export default {
  get,
  getUnanswered,
  getByEntity,
  getRelated,
  create,
  update,
  delete: deleteQuestion,
};
