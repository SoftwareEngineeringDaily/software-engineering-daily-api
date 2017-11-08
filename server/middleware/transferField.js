// This copies a req.someSource to req.someTarget;
function transferField({ source, target }) {
  return (req, res, next) => {
    if ( req[source] ) {
      req[target] = req[source];
    }
    next();
  }
}


export default transferField;
