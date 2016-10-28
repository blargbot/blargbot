var e = module.exports = {};

var moment = require('moment-timezone');
var util = require('util');


e.init = () => {
    
    

    e.category = bu.CommandType.GENERAL;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'time <timezone> [ <timezone2> <time> ]';
e.info = 'Tells you the current time in the specified timezone. If timezone2 and time are specified, converts the time from '
    + 'timezone to timezone2. Time must be formatted as <code>hh:mm[AM/PM]</code>, and timezones must use '
    + ' the timezone codes listed here: <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones>';
e.longinfo = `    <p>Tells you the current time in the specified timezone. If timezone2 and time are specified, converts the time from
    timezone to timezone2. Time must be formatted as <code>hh:mm[AM/PM]</code>, and timezones must use
        <a href="https://en.wikipedia.org/wiki/List_of_tz_database_time_zones">these</a> timezone codes.</p>`;

e.execute = (msg, words) => {
    var message = `It is currently ${moment().format('LT')} where I am!`;
    logger.debug(util.inspect(words));
    if (words.length == 2) {
        var location = words[1].split('/');
        if (location.length == 2)
            message = `In ${location[1]}, it is currently ${moment().tz(words[1]).format('LT')}`;
        else {
            message = 'Invalid parameters! See https://en.wikipedia.org/wiki/List_of_tz_database_time_zones for timezone codes that I understand.';
        }
    } else if (words.length > 3) {
        var location1 = words[1].split('/');
        var location2 = words[2].split('/');
        if (location1.length == 2 && location2.length == 2) {
            var time = moment.tz(words[3], 'hh:mma', words[1]).tz(words[2]).format('LT');
            if (time != 'Invalid date')
                message = `When it's ${moment(words[3], 'hh:mma').format('LT')} in ${location1[1]}, it's ${time} in ${location2[1]}.`;
            else
                message = `Please use the format 'hh:mma' in your time.`;
        } else
            message = 'Invalid parameters! See https://en.wikipedia.org/wiki/List_of_tz_database_time_zones for timezone codes that I understand.';

    }

    bu.send(msg.channel.id, message);
};