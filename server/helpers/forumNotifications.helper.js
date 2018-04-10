import sgMail from './mail';
import config from '../../config/config';
import Comment from '../models/comment.model';
import ForumThread from '../models/forumThread.model';

// TODO: don't email if you are the author and replying to own stuff:
function sendForumNotificationEmail({ threadId, userIdWhoReplied }) {
  try {
    ForumThread.get(threadId)
      .then((thread) => {
        const { email, _id } = thread.author;
        // Don't email if you are the author and replying to own stuff:
        if (userIdWhoReplied === _id) return;

        const msg = {
          to: email,
          from: 'no-reply@softwaredaily.com',
          subject: 'Someone commented on your thread @SoftwareDaily',
          text: `Somoene commented in your thread: ${config.baseUrl}/forum/${threadId}`,
          html: `Checkout activity on your thread: <strong> <a href="${config.baseUrl}/forum/${threadId}/"> here </a>.
          <br /><br /> <a href="${config.baseUrl}/notification-settings/"> Unsubscribe </a>`
        };
        sgMail.send(msg);
      });
  } catch (e) {
    console.log('Error emailing notification', e);
  }
}

function sendReplyEmailNotificationEmail({ parentCommentId, threadId, userIdWhoReplied }) {
  // We need to get the info for the person who made the original comment:
  try {
    Comment.get(parentCommentId)
      .then((parentComment) => {
        const { email, _id } = parentComment.author;
        // Don't email if you are the author and replying to own stuff:
        if (userIdWhoReplied === _id) return;

        const msg = {
          to: email,
          from: 'no-reply@softwaredaily.com',
          subject: 'Someone replied to you in the SoftwareDaily Forum',
          text: `Somoene replied to your comment: ${config.baseUrl}/forum/${threadId}`,
          html: `Checkout activity on your comment: <strong> <a href="${config.baseUrl}/forum/${threadId}/"> here </a>.
          <br /><br /> <a href="${config.baseUrl}/notification-settings/"> Unsubscribe </a>`
        };
        sgMail.send(msg);
      });
  } catch (e) {
    console.log('Error emailing notification:', e);
  }
}

export default { sendForumNotificationEmail, sendReplyEmailNotificationEmail };
