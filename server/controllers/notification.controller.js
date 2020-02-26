import { queue } from 'async';
import Notification from '../models/notification.model';
import websocket from '../../config/websocket';

// queue for low priority
const notificationSaveQueue = queue(saveNotification, 1);
const notificationQueue = queue(execSendNotification, 1);

async function saveNotification(task, next) {
  const { user, payload } = task;

  const notification = new Notification({
    to: user,
    notification: payload.notification,
    type: payload.type,
    entity: payload.entity
  });

  try {
    await notification.save();
  } catch (e) {
    console.error(e);
    return next();
  }

  sendNotifications(user);
  return next();
}

function sendNotifications(user) {
  notificationQueue.push(user);
}

async function execSendNotification(user, next) {
  try {
    if (!user) return next();

    const userId = user.toString();

    const connected = websocket.isConnected(userId);
    if (!connected) return next();

    // find all notifications that we need to send
    const notifications = await Notification.find({ to: user })
      .sort('-dateCreated')
      .limit(20)
      .lean()
      .exec();

    notifications.forEach((n) => {
      if (['comment', 'upvote', 'mention'].includes(n.type)) {
        n.notification.data.url = `/post/${n.entity}/${n.notification.data.slug}`; // eslint-disable-line no-param-reassign
      }
    });

    websocket.to(userId).emit('refresh.full', notifications);

    return next();
  } catch (e) {
    console.error(e);
    return next();
  }
}

function saveAndNotifyUser(payload, user) {
  notificationSaveQueue.push({ payload, user });
}

async function markReadAll(userId) {
  try {
    const result = await Notification.updateMany({ to: userId }, { $set: { read: true } });
    if (result && result.nModified) sendNotifications(userId);
  } catch (e) {
    console.error(e);
  }
}

export default {
  saveAndNotifyUser,
  sendNotifications,
  markReadAll
};
