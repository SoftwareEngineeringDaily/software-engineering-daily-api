/**
 * Custom middleware
 * @param req
 * @param res
 * @param next
 */
function isOwnUser(req, res, next) {
  const userId = req.param('userId');
  if (userId !== req.user._id) {
    res.sendStatus(401);
  }
  next();
}

export default { isOwnUser };
