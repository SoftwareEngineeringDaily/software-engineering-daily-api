
import qs from 'qs-mongodb';

function replaceRegex(item, regexFields) {
  Object.keys(item).forEach((key) => {
    if (Array.isArray(item[key])) {
      item[key].forEach((arrItem) => {
        replaceRegex(arrItem, regexFields);
      });
    }
    if (typeof item[key] === 'string' && regexFields.includes(key)) {
      item[key] = { $regex: item[key], $options: 'i' }; // eslint-disable-line
    }
    return item;
  });
  return item;
}

function parse(req, options = {}) {
  if (!req._parsedUrl) return undefined;

  const query = qs.parse(req._parsedUrl.query);

  if (options.regexFields) {
    replaceRegex(query, options.regexFields);
  }

  return query;
}

export default {
  parse
};
