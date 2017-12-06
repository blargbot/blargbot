var e = module.exports = {};



e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;

e.hidden = false;
e.usage = 'info';
e.info = 'Returns some info about me.';
e.longinfo = `<p>Gets information about the specified user.</p>`;

const { patrons, donators } = dep.reload('./donators.json');

const startDate = 1444708800000;

e.execute = (msg) => {
    console.log('aaa');
    let patronStr = patrons.map(p => {
        if (/^[0-9]{17,23}$/.test(p)) {
            return bu.getFullName(bot.users.get(p));
        } else return p;
    }).join('\n - ');
    let donatorStr = donators.map(p => {
        if (/^[0-9]{17,23}$/.test(p)) {
            return bu.getFullName(bot.users.get(p));
        } else return p;
    }).join('\n - ');
    let age = dep.moment.duration(dep.moment() - dep.moment(startDate));
    let dateStr = `${age.years()} year${age.years() != 1 ? 's' : ''}, ${age.months()} month${age.months() != 1 ? 's' : ''}, ${age.days()} day${age.days() != 1 ? 's' : ''}, ${age.hours()} hour${age.hours() != 1 ? 's' : ''}, ${age.minutes()} minute${age.minutes() != 1 ? 's' : ''}, and ${age.seconds()} second${age.seconds() != 1 ? 's' : ''}`;
    try {
        bu.send(msg, `blargbot is a multipurpose bot with new features implemented regularly, written in javascript using Eris.

:birthday: I am currently ${dateStr} old!

:heart: __**Special thanks to my patrons!**__ :heart:
** - ${patronStr}**

:heart: __**Special thanks to all my other donators!**__ :heart:
** - ${donatorStr}**

Additional credits to Aurieh#0258! :thumbsup:

For commands, do \`help\`. For information about supporting me, do \`donate\`. For any additional information, such as command documentation, please visit my website: <https://blargbot.xyz>`);
    } catch (err) {
        logger.error(err);
    }
};


function pad(value, length) {
    return (value.toString().length < length) ? pad(' ' + value, length) : value;
}
