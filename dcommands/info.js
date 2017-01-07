var e = module.exports = {};

var moment = require('moment');

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;

e.hidden = false;
e.usage = 'info';
e.info = 'Returns some info about me.';
e.longinfo = `<p>Gets information about the specified user.</p>`;

const patrons = [
    'Nex',
    '196018922854678528'
];

e.execute = (msg) => {
    let patronStr = patrons.map(p => {
        if (/^[0-9]{17,23}$/.test(p)) {
            return bu.getFullName(bot.users.get(p));
        } else return p;
    }).join('\n - ');
    try {
        bu.send(msg, `blargbot is a multipurpose bot with new features implemented regularly, written in javascript using Eris.

:heart: __**Special thanks to my patrons!**__ :heart:
** - ${patronStr}**

Additional credits to Aurieh#0258! :thumbsup:

For commands, do \`help\`. For information about supporting me, do \`donate\`. For any additional information, such as command documentation, please visit my website: <https://blargbot.xyz>`);
    } catch (err) {
        logger.error(err);
    }
};


function pad(value, length) {
    return (value.toString().length < length) ? pad(' ' + value, length) : value;
}