import sgMail from './mail';
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
    if (userToEmail.emailNotiicationSettings &&
      userToEmail.emailNotiicationSettings.unsubscribedFromThreads) return;

    // Don't email if you are the author and replying to own stuff:
    if (userIdWhoReplied.toString() === _id.toString()) return;
    const contentSummary = content.substr(0, 50);
    const msg = {
      to: email,
      from: 'no-reply@softwaredaily.com',
      subject: 'Someone commented on your thread @SoftwareDaily',
      text: `${userDesc} commented in your thread: ${config.baseUrl}/forum/${threadId}`,
      html: `${userDesc} commented on your post.
        <br />
        <br />
        "${contentSummary}..."
         [<strong> <a href="${config.baseUrl}/forum/${threadId}/"> click to read more</a>]
      <br /><br /> <a href="${config.baseUrl}/notification-settings/"> Unsubscribe </a>`
    };
    sgMail.send(msg);
  } catch (e) {
    console.log('Error emailing notification', e);
  }
}

// TODO: add date so it doesn't get minimized by google.
async function sendReplyEmailNotificationEmail({
  parentCommentId, content, threadId, userWhoReplied
}) {
  // We need to get the info for the person who made the original comment:
  try {
    const userIdWhoReplied = userWhoReplied._id;
    const userDesc = getUserDescription(userWhoReplied);
    const parentComment = await Comment.get(parentCommentId);
    const userToEmail = parentComment.author;
    const { email, _id } = parentComment.author;
    if (userToEmail.emailNotiicationSettings &&
      userToEmail.emailNotiicationSettings.unsubscribedFromCommentReplies) return;

    //  Don't send if parentComment is owned by thread creator. To prevent
    // double emailing. Make sure thread notifications are turned on:
    if (userToEmail.emailNotiicationSettings &&
      !userToEmail.emailNotiicationSettings.unsubscribedFromThreads) {
      const thread = await ForumThread.get(threadId);
      if (thread.author._id.toString() === _id.toString()) return;
    }

    // Don't email if you are the author and replying to own stuff:
    if (userIdWhoReplied.toString() === _id.toString()) return;

    const contentSummary = content.substr(0, 50);
    const msg = {
      to: email,
      from: 'no-reply@softwaredaily.com',
      subject: 'Someone replied to you in the SoftwareDaily Forum',
      text: `${userDesc} replied to your comment: ${config.baseUrl}/forum/${threadId}`,
      html: `${userDesc} replied to your comment.
        <br />
        <br />
        "${contentSummary}..."
         [<strong> <a href="${config.baseUrl}/forum/${threadId}/"> click to read more</a>]
      <br /><br /> <a href="${config.baseUrl}/notification-settings/"> Unsubscribe </a>`
    };
    sgMail.send(msg);
  } catch (e) {
    console.log('Error emailing notification:', e);
  }
}

export default { sendForumNotificationEmail, sendReplyEmailNotificationEmail };
