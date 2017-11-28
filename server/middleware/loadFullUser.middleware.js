
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
     })
     .catch(e => next(e));
   }
}

export default loadFullUser;
