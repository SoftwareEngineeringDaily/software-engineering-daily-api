import { queue } from 'async';
import Notification from '../models/notification.model';
import { ws } from '../../config/websocket';

// queue for low priority
const notificationSaveQueue = queue(saveNotification, 1);
const notificationQueue = queue(sendNotification, 1);

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
  }

  notificationQueue.push(notification);
  next();
}

function sendNotification(notification, next) {
  console.log(notification, next);
  console.log(`ws: ${typeof ws}`);
}


function notifyUser(payload, user) {
  notificationSaveQueue.push({ payload, user });
}

export default {
  notifyUser
};
