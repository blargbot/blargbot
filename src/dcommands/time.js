const BaseCommand = require('../structures/BaseCommand');
const moment = require('moment-timezone');

class TimeCommand extends BaseCommand {
    constructor() {
        super({
            name: 'time',
            category: bu.CommandType.GENERAL,
            usage: 'time < <timezone> [ <timezone2> <time> ] | <user> >',
            info: 'Tells you the current time in the specified timezone. If timezone2 and time are specified, converts the time from timezone to timezone2. Time must be formatted as `hh:mm[AM/PM]`, and timezones must use  the timezone codes listed here: <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones>. Alternatively, tells you what time it is for a specified user if they\'ve set their timezone code using the `timezone` command.'
        });
    }

    async execute(msg, words, text) {
        var message;
        let location = moment.tz.zone(words[1]);
        if (location) {
            if (words.length == 2) {
                if (location.abbr(moment()) !== '')
                    message = `In **${location.abbr(moment())}**, it is currently **${moment.tz(words[1])}**`;
                else {
                    message = 'Invalid parameters! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.';
                }
            } else if (words.length > 3) {
                var location2 = moment.tz.zone(words[2]);
                if (location && location2) {
                    var time = moment.tz(words[3], 'hh:mma', words[1]).tz(words[2]).format('LT');
                    if (time != 'Invalid date')
                        message = `When it's **${moment.tz(words[3], 'hh:mma', words[1]).format('LT')}** in **${location.abbr(moment())}**, it's **${time}** in **${location2.abbr(moment())}**.`;
                    else
                        message = `Please use the format 'hh:mma' in your time.`;
                } else
                    message = 'Invalid parameters! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.';
            }
        } else {
            let user = await bu.getUser(msg, words.length > 1 ? words.slice(1).join(' ') : msg.author.id);
            if (user && !(user.id == msg.author.id)) {
                let storedUser = await r.table('user').get(user.id);
                if (storedUser && storedUser.timezone) {
                    message = `It is currently **${moment().tz(storedUser.timezone).format('LT')}** for **${bu.getFullName(user)}**.`;
                } else message = `${bu.getFullName(user)} has not set their timezone in the \`timezone\` command yet.`;
            } else if (user.id == msg.author.id) {
                message = `It is currently <t:${moment().unix()}> for you.`;
            } else {
                message = 'You either provided an invalid user or an invalid timezone code. See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.';
            }
        }

        bu.send(msg, message);
    }
}

module.exports = TimeCommand;
