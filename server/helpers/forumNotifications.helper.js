import sgMail from './mail';
import config from '../../config/config';
import Comment from '../models/comment.model';

function sendForumNotificationEmail({ receipent, threadId }) {
  try {
    const { email } = receipent;
    const msg = {
      to: email,
      from: 'no-reply@softwaredaily.com',
      subject: 'Someone commented on your thread @SoftwareDaily',
      text: `Somoene commented in your thread: ${config.baseUrl}/${threadId}`,
      html: `Checkout activity on your thread: <strong> <a href="${config.baseUrl}/${threadId}/"> here </a>.
      <br /><br /> <a href="${config.baseUrl}/notification-settings/"> Unsubscribe </a>`
    };
    sgMail.send(msg);
  } catch (e) {
    console.log('Error emailing notification', e);
  }
}

function sendReplyEmailNotificationEmail({ parentCommentId, threadId }) {
  // We need to get the info for the person who made the original comment:
  try {
    Comment.get(parentCommentId)
      .then((parentComment) => {
        const { email } = parentComment.author;

        const msg = {
          to: email,
          from: 'no-reply@softwaredaily.com',
          subject: 'Someone replied to you in the SoftwareDaily Forum',
          text: `Somoene replied to your comment: ${config.baseUrl}/${threadId}`,
          html: `Checkout activity on your comment: <strong> <a href="${config.baseUrl}/${threadId}/"> here </a>.
          <br /><br /> <a href="${config.baseUrl}/notification-settings/"> Unsubscribe </a>`
        };
        sgMail.send(msg);
      });
  } catch (e) {
    console.log('Error emailing notification:', e);
  }
}

export default { sendForumNotificationEmail, sendReplyEmailNotificationEmail };
