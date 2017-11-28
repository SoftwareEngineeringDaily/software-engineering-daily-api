
/**
 * Custom middleware
 * @param req
 * @param res
 * @param next
 */
function loadFullUser(req, res, next) {
   if (req.user) {
     return User.get(req.user._id)
     .then((_user) => {
     })
     .catch(e => next(e));
   }
}

export default loadFullUser;
