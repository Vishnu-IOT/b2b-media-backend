// Whitelist fields from a request body. Empty strings become null so optional columns can be cleared.
const pick = (obj = {}, keys = []) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key] === '' ? null : obj[key];
    return acc;
  }, {});

module.exports = pick;
