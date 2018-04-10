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
function sendForumNotificationEmail({ threadId, userWhoReplied }) {
  try {
    const userIdWhoReplied = userWhoReplied._id;
    const userDesc = getUserDescription(userWhoReplied);
    ForumThread.get(threadId)
      .then((thread) => {
        const { email, _id } = thread.author;
        // Don't email if you are the author and replying to own stuff:
        if (userIdWhoReplied.toString() === _id.toString()) return;

        const msg = {
          to: email,
          from: 'no-reply@softwaredaily.com',
          subject: 'Someone commented on your thread @SoftwareDaily',
          text: `${userDesc} commented in your thread: ${config.baseUrl}/forum/${threadId}`,
          html: `${userDesc} replied to your thread, view thread: <strong> <a href="${config.baseUrl}/forum/${threadId}/"> here </a>.
          <br /><br /> <a href="${config.baseUrl}/notification-settings/"> Unsubscribe </a>`
        };
        sgMail.send(msg);
      });
  } catch (e) {
    console.log('Error emailing notification', e);
  }
}

// TODO: don't send if parentComment is owned by thread creator. To prevent
// double emailing.
function sendReplyEmailNotificationEmail({ parentCommentId, threadId, userWhoReplied }) {
  // We need to get the info for the person who made the original comment:
  try {
    const userIdWhoReplied = userWhoReplied._id;
    const userDesc = getUserDescription(userWhoReplied);
    Comment.get(parentCommentId)
      .then((parentComment) => {
        const { email, _id } = parentComment.author;
        // Don't email if you are the author and replying to own stuff:
        if (userIdWhoReplied.toString() === _id.toString()) return;

        const msg = {
          to: email,
          from: 'no-reply@softwaredaily.com',
          subject: 'Someone replied to you in the SoftwareDaily Forum',
          text: `${userDesc} replied to your comment: ${config.baseUrl}/forum/${threadId}`,
          html: `${userDesc} replied to your comment. View it: <strong> <a href="${config.baseUrl}/forum/${threadId}/"> here </a>.
          <br /><br /> <a href="${config.baseUrl}/notification-settings/"> Unsubscribe </a>`
        };
        sgMail.send(msg);
      });
  } catch (e) {
    console.log('Error emailing notification:', e);
  }
}

export default { sendForumNotificationEmail, sendReplyEmailNotificationEmail };
