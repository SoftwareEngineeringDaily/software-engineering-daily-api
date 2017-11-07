// This copies a req.someSource to req.someTarget;
function transferField({ source, target }) {
  function cb(req, res, next)  {
    if ( req[source] ) {
      req[target] = req[source];
    }
    next();
  }
  return cb;
}


export default transferField;
