
import config from '../../config/config';
import Comment from '../models/comment.model';
import Post from '../models/post.model';
import TopicPage from '../models/topicPage.model';
import User from '../models/user.model';
import { mailTemplate } from '../helpers/mail';

async function handleNotification(entityId, entityType, user, rawComment) {
  const { comment, commenter, entityData } = await getData(entityId, entityType, user, rawComment);

  // always send to entity author
  if (isSubscribed(entityData.author, 'thread')) mailThreadAuthor(entityData, commenter, comment);

  // send to comment author when is a reply
  if (comment.parentComment && isSubscribed(comment.parentComment.author, 'reply')) {
    mailReply(entityData, commenter, comment);
  }

  // send for mentioned
  if (comment.mentionedUsers && comment.mentionedUsers.length) {
    comment.mentionedUsers.forEach((mentionedUser) => {
      if (isSubscribed(mentionedUser, 'mention')) mailMention(entityData, commenter, comment, mentionedUser);
    });
  }
}

async function handleUpdatedComment(entityId, entityType, user, rawComment, newMentions) {
  const { comment, commenter, entityData } = await getData(entityId, entityType, user, rawComment);

  if (newMentions && newMentions.length) {
    newMentions.forEach((mentionedUser) => {
      if (isSubscribed(mentionedUser, 'mention')) mailMention(entityData, commenter, comment, mentionedUser);
    });
  }
}

async function getData(entityId, entityType, user, rawComment) {
  const comment = rawComment.toObject();
  await setMentionContent(comment);
  comment.content = comment.content.replace(/\n/g, '<br/>');

  const entityData = await getEntityData(entityId, entityType);
  if (!entityData) return {};

  const commenter = {
    ...user,
    fullName: user.lastName ? `${user.name} ${user.lastName}` : user.name
  };
  if (comment.parentComment) {
    comment.parentComment = await Comment.findById(comment.parentComment).populate('author', '-password').lean();
    if (comment.parentComment.author) {
      comment.parentComment.content = comment.parentComment.content.replace(/\n/g, '<br/>');
      await setMentionContent(comment.parentComment);
      const pa = comment.parentComment.author;
      comment.parentComment.author.fullName = pa.lastName ? `${pa.name} ${pa.lastName}` : pa.name;
    }
  }

  return { comment, commenter, entityData };
}

function mailThreadAuthor(entityData, commenter, comment) {
  if (!entityData.author.email) return;
  if (commenter._id.toString() === entityData.author._id.toString()) return;

  mailTemplate.postNewCommentAuthor({
    to: entityData.author.email,
    subject: `New comment on ${entityData.title}`,
    data: {
      user: entityData.author.fullName,
      commenter,
      comment,
      entityLink: entityData.link,
      entityName: entityData.name,
      unsubscribeLink: `${config.baseUrl}/settings`
    }
  });
}

function mailReply(entityData, commenter, comment) {
  if (!comment.parentComment.author || !comment.parentComment.author.email) return;
  if (commenter._id.toString() === comment.parentComment.author._id.toString()) return;

  mailTemplate.postNewCommentReply({
    to: comment.parentComment.author.email,
    subject: `New replied comment on ${entityData.title}`,
    data: {
      user: comment.parentComment.author.fullName,
      commenter,
      comment,
      entityLink: entityData.link,
      entityName: entityData.name,
      unsubscribeLink: `${config.baseUrl}/settings`
    }
  });
}

function mailMention(entityData, commenter, comment, mentionedUser) {
  if (!mentionedUser || !mentionedUser.email) return;
  if (commenter._id.toString() === mentionedUser._id.toString()) return;

  mailTemplate.postNewCommentMention({
    to: mentionedUser.email,
    subject: `New mention on ${entityData.title}`,
    data: {
      user: mentionedUser.fullName,
      commenter,
      comment,
      entityLink: entityData.link,
      entityName: entityData.name,
      unsubscribeLink: `${config.baseUrl}/settings`
    }
  });
}

async function getEntityData(entityId, entityType) {
  if (entityType === 'forumthread') {
    const post = await Post.findOne({ thread: entityId })
      .populate('thread')
      .lean();

    const author = await User.findById(post.thread.author).select('name lastName emailNotificationSettings email').lean();
    if (!author) return false;
    author.fullName = author.lastName ? `${author.name} ${author.lastName}` : author.name;

    return {
      entity: post,
      name: 'post',
      title: post.title.rendered,
      link: `${config.baseUrl}/post/${post._id}/${post.slug}`,
      author
    };
  }

  if (entityType === 'topic') {
    const topicPage = await TopicPage.findById(entityId)
      .populate('topic')
      .lean()
      .exec();

    const author = await User.findById(topicPage.topic.maintainer).select('name lastName emailNotificationSettings email').lean();
    if (!author) return false;
    author.fullName = author.lastName ? `${author.name} ${author.lastName}` : author.name;

    return {
      entity: topicPage,
      name: 'topic',
      title: topicPage.topic.name,
      link: `${config.baseUrl}/topic/${topicPage.topic.slug}`,
      author
    };
  }

  return null;
}

function isSubscribed(user, type) {
  if (!user.emailNotificationSettings) return true;

  switch (type) {
    case 'thread': return !user.emailNotificationSettings.unsubscribedFromThreads;
    case 'reply': return !user.emailNotificationSettings.unsubscribedFromCommentReplies;
    case 'mention': return !user.emailNotificationSettings.unsubscribedFromThreads;
    default:
      return false;
  }
}

async function getMentionedUsers(mentions) {
  const users = [];

  for (let i = 0; i < mentions.length; i += 1) {
    const user = await User.findById(mentions[i]) // eslint-disable-line 
      .select('name lastName email avatarUrl emailNotificationSettings')
      .lean();
    if (user && !users.find(u => u._id === user._id)) {
      user.fullName = user.lastName ? `${user.name} ${user.lastName}` : user.name;
      users.push(user);
    }
  }

  return users;
}

async function setMentionContent(comment) {
  if (!comment.mentions || !comment.mentions.length) return;

  comment.mentionedUsers = await getMentionedUsers(comment.mentions); // eslint-disable-line

  comment.mentionedUsers.forEach((user) => {
    comment.content = comment.content.replace(new RegExp(`@${user._id}`, 'ig'), `<b>@${user.fullName}</b>`); // eslint-disable-line
  });
}

export default {
  handleNotification,
  handleUpdatedComment
};
