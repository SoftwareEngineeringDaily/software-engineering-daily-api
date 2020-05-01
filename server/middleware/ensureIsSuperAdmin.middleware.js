import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

export default // NOTE requires full user to be called..
// eslint-disable-next-line
async function ensureIsSuperAdmin(req, res, next) {
  const loggedInUser = req.fullUser.toObject();
  if (!loggedInUser.isSuperAdmin) {
    let err = new APIError('Must be an Super Admin to do that', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
    return next(err);
  }
  req.isSuperAdmin = true;
  next();
}
