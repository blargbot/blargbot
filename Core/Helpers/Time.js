const BaseHelper = require('./BaseHelper');
const sherlock = require('sherlockjs');

class TimeHelper extends BaseHelper {
  constructor(client) {
    super(client);
  }

  parseDuration(text) {
    let sherlocked = sherlock.parse(text);
  }
}

module.exports = TimeHelper;