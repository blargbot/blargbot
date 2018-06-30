const BaseCommand = require('../structures/BaseCommand');
const moment = require('moment-timezone');

class TimezoneCommand extends BaseCommand {
    constructor() {
        super({
            name: 'timezone',
            category: bu.CommandType.GENERAL,
            usage: 'time [timezone]',
            info: 'Sets or retrieves your timezone. Timezones must use  the timezone codes listed here: <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones>'
        });
    }

    async execute(msg, words, text) {
        let message;
        if (words.length > 1) {
            let code = words.slice(1).join(' ').toUpperCase();
            let tz = moment().tz(code);
            if (tz.zoneAbbr() === '') {
                message = 'Invalid parameters! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.';
            } else {
                message = `Ok, your timezone code is now set to \`${code}\`, which is equivalent to ${tz.format('z (Z)')}.`;
                await r.table('user').get(msg.author.id).update({ timezone: code });
            }
        } else {
            let storedUser = await r.table('user').get(msg.author.id);
            if (!storedUser.timezone)
                message = 'You haven\'t set a timezone yet.';
            else
                message = `Your stored timezone code is \`${storedUser.timezone}\`, which is equivalent to ${moment().tz(storedUser.timezone).format('z (Z)')}.`;
        }
        await bu.send(msg, message);
    }
}

module.exports = TimezoneCommand;
