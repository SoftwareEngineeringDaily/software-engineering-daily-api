import User from '../models/user.model';
import { getActivityTree } from '../helpers/activity.helper';
import { getBadges } from '../helpers/badge.helper';

const activityDays = 10;

async function getPublic(req, res) {
  const userId = req.params.profileId;
  const user = await User.findById(userId)
    .select('name bio avatarUrl twitter')
    .lean()
    .exec();

  const badges = await getBadges(userId);
  const activities = await getActivityTree(userId, activityDays);

  return res.status(200).send({
    user,
    activities,
    badges,
    activityDays
  });
}

async function getActivities(req, res) {
  const { userId } = req.params;
  const badges = await getBadges(userId);
  const activities = await getActivityTree(userId, activityDays);

  return res.status(200).send({
    activities,
    badges,
    activityDays
  });
}

export default {
  getPublic,
  getActivities
};
