import moment from 'moment';
import { groupBy } from 'lodash';
import Comment from '../models/comment.model';
import RelatedLink from '../models/relatedLink.model';
import Post from '../models/post.model';
import Answer from '../models/answer.model';
import TopicPage from '../models/topicPage.model';
import Topic from '../models/topic.model';

const cachedPosts = [];
const cachedTopicPages = [];
const cachedTopics = [];

async function getActivityTree(userId, days) {
  const limitDate = moment().subtract(days, 'days');
  const comments = await getComments(userId, limitDate);

  const postComments = comments.filter(c => !c.entityType || c.entityType === 'forumthread');
  const topicComments = comments.filter(c => c.entityType === 'topic');

  await populatePosts({
    data: postComments,
    field: 'rootEntity',
    postField: 'thread',
    cache: cachedPosts
  });

  await populateTopic({
    data: topicComments,
    field: 'rootEntity',
    type: 'topicPage',
    cache: cachedTopicPages
  });

  const relatedLinks = await getRelatedLinks(userId, limitDate);
  const answeredQuestions = await getAnsweredQuestions(userId, limitDate);
  const postRelatedLinks = relatedLinks.filter(r => r.post);
  const topicRelatedLinks = relatedLinks.filter(r => r.topicPage);

  await populatePosts({
    data: postRelatedLinks,
    field: 'post',
    postField: '_id',
    cache: cachedPosts
  });

  await populateTopic({
    data: topicRelatedLinks,
    field: 'topicPage',
    type: 'topicPage',
    cache: cachedTopicPages
  });

  const activities = [].concat(
    postComments,
    topicComments,
    answeredQuestions,
    relatedLinks,
  );

  if (!activities.length) {
    return null;
  }

  activities.sort((o1, o2) => {
    return o1.dateCreated >= o2.dateCreated ? -1 : 1;
  });

  return groupBy(activities, 'groupDate');
}

async function getComments(userId, limitDate) {
  return Comment.find({
    author: userId,
    dateCreated: { $gte: limitDate.toDate() },
    deleted: false,
  })
    .select('rootEntity entityType dateCreated highlight content mentions')
    .populate('mentions')
    .sort('-dateCreated')
    .lean()
    .exec()
    .map(async (item) => {
      return {
        ...item,
        activityType: 'comment',
        groupDate: moment(item.dateCreated).format('YYYY-MM-DD'),
      };
    });
}

async function getAnsweredQuestions(userId, limitDate) {
  const options = {
    author: userId,
    dateCreated: {
      $gte: limitDate.toDate(),
    },
    $or: [{
      deleted: false,
    }, {
      deleted: {
        $exists: false,
      },
    }],
  };

  let answers = await Answer.find(options)
    .select('content dateCreated question')
    .populate('question')
    .sort('-dateCreated')
    .lean()
    .exec();

  answers = answers.map(item => ({
    ...item,
    topic: item.question.entityId,
    activityType: 'answer',
    groupDate: moment(item.dateCreated).format('YYYY-MM-DD'),
  }));

  await populateTopic({
    data: answers,
    field: 'topic',
    type: 'topic',
    cache: cachedTopics
  });

  return answers
    .filter(a => a.entity)
    .map(a => ({
      ...a,
      entity: {
        ...a.entity,
        title: a.question.content,
        url: `/${a.question.entityType}/${a.entity.slug}/question/${a.question._id}#answer-${a._id}`,
      },
    }));
}

async function getRelatedLinks(userId, limitDate) {
  return RelatedLink.find({
    author: userId,
    dateCreated: { $gte: limitDate.toDate() },
    deleted: false
  })
    .select('post topicPage url dateCreated title type')
    .sort('-dateCreated')
    .lean()
    .exec()
    .map((item) => {
      return {
        ...item,
        activityType: 'relatedLink',
        groupDate: moment(item.dateCreated).format('YYYY-MM-DD'),
      };
    });
}

// populates post info from a cached array of posts that
// exists for this request
async function populatePosts(options) {
  for (let i = 0; i < options.data.length; i += 1) {
    const item = options.data[i];
    const find = item[options.field];

    if (!find) {
      return options.data;
    }

    let post = options.cache.find(p => (
      p[options.postField || '_id'].toString() === find.toString()
    ));

    if (!post) {
      try {
        post = await getPost(find); // eslint-disable-line no-await-in-loop
        if (post) {
          post = post.toObject();
          post.title = post.title.rendered;
          post.url = `/post/${post._id}/${post.slug}`;
          options.cache.push(post);
        }
      } catch (e) {
        console.error(e); // eslint-disable-line
      }
    }

    item.entity = post; // eslint-disable-line no-param-reassign
  }
  return options.data;
}

async function populateTopic(options) {
  for (let i = 0; i < options.data.length; i += 1) {
    const item = options.data[i];
    const find = item[options.field];

    let topic = options.cache.find(p => (
      p._id.toString() === find.toString()
    ));

    if (!topic) {
      try {
        topic = (options.type === 'topic')
          ? await getTopic(find) // eslint-disable-line no-await-in-loop
          : await getTopicPage(find); // eslint-disable-line no-await-in-loop

        if (topic) {
          topic = topic.toObject();
          topic.title = topic.name;
          topic.url = `/topic/${topic.slug}`;
          options.cache.push(topic);
        }
      } catch (e) {
        console.error(e); // eslint-disable-line
      }
    }

    item.entity = topic; // eslint-disable-line no-param-reassign
  }
  return options.data;
}

async function getPost(threadId) {
  return Post.findOne({ thread: threadId })
    .select('slug title thread')
    .exec();
}

async function getTopicPage(id) {
  const topicPage = await TopicPage.findById(id)
    .populate('topic')
    .exec();

  return topicPage.topic;
}

async function getTopic(id) {
  const topic = await Topic.findById(id)
    .exec();

  return topic;
}

export default {
  getActivityTree
};
