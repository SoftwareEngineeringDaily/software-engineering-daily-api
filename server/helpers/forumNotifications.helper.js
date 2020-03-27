import each from 'lodash/each';
import { sgMail } from './mail';
import config from '../../config/config';
import Comment from '../models/comment.model';
import ForumThread from '../models/forumThread.model';

function getUserDescription(userWhoReplied) {
  let userDesc = 'Someone';

  if (userWhoReplied.username) {
    userDesc = userWhoReplied.username;
  }

  if (userWhoReplied.name) {
    userDesc = userWhoReplied.name;
  }

  return userDesc;
}

// TODO: don't email if you are the author and replying to own stuff:
async function sendForumNotificationEmail({ threadId, content, userWhoReplied }) {
  try {
    const userIdWhoReplied = userWhoReplied._id;
    const userDesc = getUserDescription(userWhoReplied);
    const thread = await ForumThread.get(threadId);
    const userToEmail = thread.author;
    const { email, _id } = thread.author;
    const { emailNotificationSettings } = userToEmail;
    const userIsAuthor = (userIdWhoReplied.toString() === _id.toString());
    const isUnsubscribed = (
      emailNotificationSettings &&
      emailNotificationSettings.unsubscribedFromThreads
    );

    if (isUnsubscribed || userIsAuthor) {
      return;
    }

    const contentSummary = content.substr(0, 50);
    const msg = {
      to: email,
      from: config.email.fromAddress,
      subject: `New comment on ${thread.title || contentSummary}`,
      text: `${userDesc} commented in your thread: ${config.baseUrl}/forum/${threadId}`,
      html: `${userDesc} commented on your post.
        <br />
        <br />
        "${content}"
         [<strong> <a href="${config.baseUrl}/forum/${threadId}/"> click to read more</a>]
      <br /><br /> <a href="${config.baseUrl}/notification-settings/"> Unsubscribe </a>`
    };

    sgMail.send(msg);
  } catch (e) {
    console.log('Error emailing notification', e); // eslint-disable-line
  }
}

async function sendReplyNotificationEmail({
  parentCommentId, content, threadId, userWhoReplied
}) {
  // We need to get the info for the person who made the original comment:
  try {
    const userIdWhoReplied = userWhoReplied._id;
    const userDesc = getUserDescription(userWhoReplied);
    const parentComment = await Comment.get(parentCommentId);
    const userToEmail = parentComment.author;
    const { email, _id } = parentComment.author;

    if (
      userToEmail.emailNotificationSettings &&
      userToEmail.emailNotificationSettings.unsubscribedFromCommentReplies
    ) {
      return;
    }

    // Don't send if parentComment is owned by thread creator. To prevent
    // double emailing. Make sure thread notifications are turned on:
    if (
      userToEmail.emailNotificationSettings &&
      !userToEmail.emailNotificationSettings.unsubscribedFromThreads
    ) {
      const thread = await ForumThread.get(threadId);
      if (thread.author._id.toString() === _id.toString()) {
        return;
      }
    }

    // Don't email if you are the author and replying to own stuff:
    if (userIdWhoReplied.toString() === _id.toString()) {
      return;
    }

    const msg = {
      to: email,
      from: config.email.fromAddress,
      subject: 'Someone replied to you in the Forum',
      text: `${userDesc} replied to your comment: ${config.baseUrl}/forum/${threadId}`,
      html: `${userDesc} replied to your comment.
        <br />
        <br />
        "${content}..."
         [<strong> <a href="${config.baseUrl}/forum/${threadId}/"> click to read more</a>]
      <br /><br /> <a href="${config.baseUrl}/notification-settings/"> Unsubscribe </a>`
    };
    sgMail.send(msg);
  } catch (e) {
    console.log('Error emailing notification:', e); // eslint-disable-line
  }
}

async function sendMentionsNotificationEmail(props) {
  const { threadId, userWhoReplied, usersMentioned = [] } = props;
  const userDesc = getUserDescription(userWhoReplied);
  const { title } = await ForumThread.findById(threadId);
  let { content } = props;

  // Fix `@mentions` labels
  usersMentioned.forEach((user) => {
    content = content.replace(user._id, user.name); // eslint-disable-line
  });

  try {
    each(usersMentioned, (userToEmail) => { // eslint-disable-line
      const { email, emailNotificationSettings } = userToEmail;
      const validEmail = !!(email);
      const isUnsubscribed = (
        emailNotificationSettings &&
        emailNotificationSettings.unsubscribedFromMentions
      );

      if (isUnsubscribed || !validEmail) {
        return console.log('Unsubscribed from mentions', userToEmail); // eslint-disable-line
      }

      const msg = {
        to: email,
        from: config.email.fromAddress,
        subject: `New comment on ${title}`,
        text: `${userDesc} mentioned you: ${config.baseUrl}/forum/${threadId}`,
        html: `${userDesc} mentioned you.
        <br />
        <br />
        "${content}"
        <strong>[<a href="${config.baseUrl}/post/${threadId}/"> click to read more</a>]
        <br /><br /><a href="${config.baseUrl}/notification-settings/">Unsubscribe</a>`
      };

      sgMail.send(msg);
    });
  } catch (e) {
    console.log('Error emailing notification', e); // eslint-disable-line
  }
}


export default {
  sendForumNotificationEmail,
  sendMentionsNotificationEmail,
  sendReplyNotificationEmail
};
