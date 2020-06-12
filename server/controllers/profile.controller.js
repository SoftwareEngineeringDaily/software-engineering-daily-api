import User from '../models/user.model';
import { getActivityTree } from '../helpers/activity.helper';

const activityDays = process.env.NODE_ENV === 'production' ? 10 : 100;

async function getPublic(req, res) {
  const userId = req.params.profileId;
  const user = await User.findById(userId)
    .select('name lastName bio avatarUrl twitter website')
    .lean()
    .exec();

  const activities = await getActivityTree(userId, activityDays);

  return res.status(200).send({
    user,
    activities,
    activityDays
  });
}

async function getActivities(req, res) {
  const { userId } = req.params;
  const activities = await getActivityTree(userId, activityDays);

  return res.status(200).send({
    activities,
    activityDays
  });
}

export default {
  getPublic,
  getActivities
};
