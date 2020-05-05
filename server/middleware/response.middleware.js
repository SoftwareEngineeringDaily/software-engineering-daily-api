export default function response(req, res) {
  res.json(req.response || {});
}
