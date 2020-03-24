import TopicPage from '../models/topicPage.model';
import TopicSubscription from '../models/topicSubscription.model';
import { saveAndNotifyUser } from '../controllers/notification.controller';

async function getTopic(entityId) {
  const topicPage = await TopicPage.findOne({ _id: entityId })
    .populate('topic')
    .exec();
  return topicPage.topic;
}

async function subscribeTopicPage(entityId, user) {
  const data = {
    user: user._id,
    topic: entityId
  };

  const options = {
    upsert: true,
    setDefaultsOnInsert: true
  };

  await TopicSubscription.findOneAndUpdate(data, data, options);
  return getTopic(entityId);
}

async function notifySubscribers(entityId, user, payload, ignoreNotify = []) {
  // get everyone that we need to notify
  const users = await TopicSubscription.find({ topic: entityId })
    .where('user').ne(user._id) // ignore own user
    .select('user')
    .lean()
    .exec()
    .map(s => s.user);

  if (!users.length) return;

  // save and sends an update with all the latest notifications
  users.forEach((u) => {
    // ignoring users that already received a mention
    if (!ignoreNotify.includes(u.toString())) saveAndNotifyUser(payload, u);
  });
}

export default {
  subscribeTopicPage,
  notifySubscribers
};
