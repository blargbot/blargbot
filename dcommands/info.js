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
    '228574821590499329'
];

e.execute = (msg) => {
    let patronStr = patrons.map(p => {
        if (/^[0-9]{17,23}$/.test(p)) {
            return bu.getFullName(bot.users.get(p));
        } else return p;
    }).join('\n - ');
    try {
        bu.send(msg, `blargbot is a multipurpose bot with new features implemented regularly, written in javascript using Eris.
https://blargbot.xyz
\`\`\`prolog
!== { Stats } ==!
${pad('Guilds:', 10)} ${bot.guilds.size}
${pad('Channels:', 10)} ${Object.keys(bot.channelGuildMap).length}
${pad('Users:', 10)} ${bot.users.size}
${pad('RAM:', 10)} ${bu.getMemoryUsage()}MiB
${pad('Uptime:', 10)} ${bu.createTimeDiffString(moment(), bu.startTime)}
${pad('Version:', 10)} ${bu.VERSION}
\`\`\`

:heart: __**Special thanks to my patrons!**__ :heart:
** - ${patronStr}**

Additional credits to Aurieh#0258! :thumbsup:

For commands, do \`help\`. For information about supporting me, do \`donate\``);
    } catch (err) {
        logger.error(err);
    }
};


function pad(value, length) {
    return (value.toString().length < length) ? pad(' ' + value, length) : value;
}