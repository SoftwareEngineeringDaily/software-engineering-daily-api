import User from '../models/user.model';
import { getActivityTree } from '../helpers/activity.helper';

const activityDays = 10;

async function getPublic(req, res) {
  const div = req.params.profileId.split('-');

  if (!div.length || div.length === 1) return res.status(404).send();

  const userId = div[div.length - 1];

  const user = await User.findById(userId)
    .select('name bio avatarUrl')
    .lean()
    .exec();

  const activities = await getActivityTree(userId, activityDays);

  return res.status(200).send({ user, activities, activityDays });
}

async function getActivities(req, res) {
  const activities = await getActivityTree(req.params.userId, activityDays);
  return res.status(200).send({ activities, activityDays });
}

export default {
  getPublic,
  getActivities
};
