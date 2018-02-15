const BaseHelper = require('./BaseHelper');
const Sherlock = require('sherlockjs');
const parse = require('parse-duration');
const moment = require('moment');

class TimeHelper extends BaseHelper {
  constructor(client) {
    super(client);
  }

  parseDuration(text) {
    let locked;
    let time = parse(text);
    if (time === 0) {
      locked = Sherlock.parse(text);

      if (locked.startDate && locked.endDate) {
        time = locked.endDate - locked.startDate;
      } else if (locked.startDate) {
        time = locked.startDate - Date.now();
      }
    }
    return time ? moment.duration(time) : null;
  }

  getEnd(text) {
    let duration = this.parseDuration(text);
    if (duration === null) return null;
    return moment().add(duration);
  }
}

module.exports = TimeHelper;