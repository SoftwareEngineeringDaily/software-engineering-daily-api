import moment from 'moment';
import { groupBy } from 'lodash';
import Comment from '../models/comment.model';
import RelatedLink from '../models/relatedLink.model';
import Post from '../models/post.model';
import TopicPage from '../models/topicPage.model';

async function getActivityTree(userId, days) {
  const limitDate = moment().subtract(days, 'days');

  const cachedPosts = [];
  const cachedTopics = [];

  const comments = await getComments(userId, limitDate);

  const postComments = comments.filter(c => !c.entityType || c.entityType === 'forumthread');
  const topicComments = comments.filter(c => c.entityType === 'topic');

  await populatePosts({
    data: postComments,
    field: 'rootEntity',
    postField: 'thread',
    cachedPosts
  });

  await populateTopics({
    data: topicComments,
    field: 'rootEntity',
    cachedTopics
  });

  const relatedLinks = await getRelatedLinks(userId, limitDate);
  const postRelatedLinks = relatedLinks.filter(r => r.post);
  const topicRelatedLinks = relatedLinks.filter(r => r.topicPage);

  await populatePosts({
    data: postRelatedLinks,
    field: 'post',
    postField: '_id',
    cachedPosts
  });

  await populateTopics({
    data: topicRelatedLinks,
    field: 'topicPage',
    cachedTopics
  });

  const activities = [].concat(postComments, topicComments, relatedLinks);

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

    let post = options.cachedPosts.find(p => (
      p[options.postField || '_id'].toString() === find.toString()
    ));

    if (!post) {
      try {
        post = await getPost(find); // eslint-disable-line no-await-in-loop
        if (post) {
          post = post.toObject();
          post.title = post.title.rendered;
          post.url = `/post/${post._id}/${post.slug}`;
          options.cachedPosts.push(post);
        }
      } catch (e) {
        console.error(e);
      }
    }

    item.entity = post; // eslint-disable-line no-param-reassign
  }
  return options.data;
}

async function populateTopics(options) {
  for (let i = 0; i < options.data.length; i += 1) {
    const item = options.data[i];
    const find = item[options.field];

    let topic = options.cachedTopics.find(p => (
      p._id.toString() === find.toString()
    ));

    if (!topic) {
      try {
        topic = await getTopic(find); // eslint-disable-line no-await-in-loop
        if (topic) {
          topic = topic.toObject();
          topic.title = topic.name;
          topic.url = `/topic/${topic.slug}`;
          options.cachedTopics.push(topic);
        }
      } catch (e) {
        console.error(e);
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

async function getTopic(id) {
  const topicPage = await TopicPage.findById(id)
    .populate('topic')
    .exec();

  return topicPage.topic;
}

export default {
  getActivityTree
};
