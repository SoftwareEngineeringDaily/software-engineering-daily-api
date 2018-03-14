import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

export default // NOTE requires full user to be called..
// eslint-disable-next-line
async function ensureIsAdmin(req, res, next) {
  // TODO: call loadFull User if it doesn't exist
  const loggedInUser = req.fullUser.toObject();
  // We might want to allow anyone to search users eventually.
  if (!loggedInUser.isAdmin) {
    let err = new APIError('Must be an admin to do that', httpStatus.UNAUTHORIZED, true); //eslint-disable-line
    return next(err);
  }
  req.isAdmin = true;
  next();
}
