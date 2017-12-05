import User from '../models/user.model';
/**
 * Custom middleware
 * @param req
 * @param res
 * @param next
 */

function loadFullUser(req, res, next) {
   if (req.user) {
     return User.get(req.user._id)
     .then((fullUser) => {
       if (fullUser) {
         req.fullUser = fullUser;
       }
       next();
     })
     .catch(e => next(e));
   } else {
     next();
   }
}

export default loadFullUser;
