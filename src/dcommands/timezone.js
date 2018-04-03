var e = module.exports = {};




e.init = () => {
    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'time [timezone]';
e.info = 'Sets or retrieves your timezone. Timezones must use ' +
    ' the timezone codes listed here: <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones>';
e.longinfo = `Sets or retrieves your timezone. Timezones must use
        <a href="https://en.wikipedia.org/wiki/List_of_tz_database_time_zones">these</a> timezone codes.</p>`;

e.execute = async (msg, words) => {
    let message;
    if (words.length > 1) {
        let code = words.slice(1).join(' ').toUpperCase();
        let tz = dep.moment().tz(code);
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
            message = `Your stored timezone code is \`${storedUser.timezone}\`, which is equivalent to ${dep.moment().tz(storedUser.timezone).format('z (Z)')}.`
    }
    await bu.send(msg, message);
};