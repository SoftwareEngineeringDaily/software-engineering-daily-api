import async from 'async';
import isArray from 'lodash/isArray';
import Question from '../models/question.model';
import topicPageCtrl from './topicPage.controller';

async function get(req, res) {
  const question = await Question.findById(req.params.id).populate('answers');

  if (!question) return res.status(404).send('Not found');

  question.answers.sort((o1, o2) => {
    return o1.votes.length >= o2.votes.length ? -1 : 1;
  });

  return res.json(question.toObject());
}

async function create(req, res) {
  const {
    entityId, entityType, content, questions
  } = req.body;

  if (!entityId || !entityType || (!content && !questions)) return res.status(400).send('Missing data');

  const author = req.user._id;
  const series = [];
  const saved = [];
  let contents = [];

  if (content) {
    contents.push(content.trim());
  }
  if (questions) {
    contents = questions.filter(q => !!q);
  }

  questions.forEach((questionContent) => {
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
    if (err) return res.status(500).end(err.message ? err.message : err.toString());
    if (entityType === 'topic') topicPageCtrl.createTopicPage(entityId);
    if (saved.length === 1) return res.json(saved[0]);
    return res.json(saved);
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
      ? b.dateCreated - a.dateCreated
      : b.answers.length - a.answers.length;
  });

  return res.json(questions);
}

async function update(req, res) {
  const question = await Question.findById(req.params.id);

  if (!question) return res.status(404).send('Not found');

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
  const question = await Question.findById(req.params.id);

  if (!question) return res.status(404).send('Not found');

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
  getByEntity,
  getRelated,
  create,
  update,
  delete: deleteQuestion,
};
