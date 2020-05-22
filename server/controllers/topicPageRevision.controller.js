
import Topic from '../models/topic.model';
import TopicPage from '../models/topicPage.model';
import TopicPageRevision from '../models/topicPageRevision.model';

async function create(topicPage, user) {
  const revision = new TopicPageRevision({
    topicPage: topicPage._id,
    author: user._id,
    content: topicPage.content,
    logo: topicPage.logo,
    revision: topicPage.lastRevision ? topicPage.lastRevision + 1 : 1,
  });

  const saved = await revision.save();
  return saved;
}

async function getAll(topicPageId) {
  const revisions = await TopicPageRevision.find({ topicPage: topicPageId })
    .select('author revision dateCreated topicPage')
    .populate('author', 'name lastName avatarUrl');

  revisions.sort((a, b) => {
    if (!b) return -1;
    return b.dateCreated - a.dateCreated;
  });

  return revisions;
}

async function get(req, res) {
  const { revisionNumber, slug } = req.params;

  const topic = await Topic.findOne({ slug }).select('topicPage');

  if (!topic) {
    return res.status(404).send(`Topic ${slug} not found`);
  }

  const revision = await TopicPageRevision.findOne({
    topicPage: topic.topicPage,
    revision: revisionNumber
  })
    .populate('author', 'name lastName avatarUrl');

  return res.json(revision);
}

async function set(req, res) {
  const { revisionNumber, slug } = req.params;

  try {
    const topic = await Topic.findOne({ slug }).select('topicPage');

    if (!topic) {
      return res.status(404).send(`Topic ${slug} not found`);
    }

    const revision = await TopicPageRevision.findOne({
      topicPage: topic.topicPage,
      revision: revisionNumber
    });

    if (!revision) {
      return res.status(404).send(`Revision number (${revisionNumber}) not found`);
    }

    const topicPage = await TopicPage.findById(topic.topicPage);

    if (!topicPage) {
      return res.status(404).send('Topic Page not found');
    }

    topicPage.revision = revision.revision;
    topicPage.content = revision.content;
    topicPage.logo = revision.logo;

    topicPage.history = topicPage.history.concat(new TopicPage.History({
      user: req.user._id,
      event: 'revisionRecover',
      revision: revision.revision
    }));

    await topicPage.save();

    return res.end('Saved');
  } catch (e) {
    return res.status(500).end(e.message ? e.message : e.toString());
  }
}

export default {
  create,
  getAll,
  get,
  set
};
