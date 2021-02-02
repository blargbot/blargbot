const moment = require('moment-timezone');

function duration(text) {
    let duration = moment.duration();
    if (/([0-9]+) ?(day|days|d)/i.test(text))
        duration.add(parseInt(text.match(/([0-9]+) ?(day|days|d)/i)[1]) || 0, 'd');
    if (/([0-9]+) ?(hours|hour|h)/i.test(text))
        duration.add(parseInt(text.match(/([0-9]+) ?(hours|hour|h)/i)[1]) || 0, 'h');
    if (/([0-9]+) ?(minutes|minute|mins|min|m)/i.test(text))
        duration.add(parseInt(text.match(/([0-9]+) ?(minutes|minute|mins|min|m)/i)[1]) || 0, 'm');
    if (/((?:[0-9]*[.])?[0-9]+) ?(seconds|second|secs|sec|s)/i.test(text))
        duration.add(Math.floor(parseFloat(text.match(/((?:[0-9]*[.])?[0-9]+) ?(seconds|second|secs|sec|s)/i)[1]) * 1000) || 0, 'ms');
    return duration;
}

module.exports = { duration };
