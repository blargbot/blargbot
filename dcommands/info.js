var e = module.exports = {};
var bu = require('./../util.js');
var moment = require('moment');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'info';
e.info = 'Returns some info about me.';
e.longinfo = `<p>Gets information about the specified user.</p>`;
e.category = bu.CommandType.GENERAL;

e.execute = (msg) => {
    try {
    bu.sendMessageToDiscord(msg.channel.id, `blargbot is a multipurpose bot with new features implemented regularly, written in javascript using Eris.
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
For commands, do \`help\`. For information about supporting me, do \`donate\``);
    } catch (err) {
        console.log(err);
    }
};


function pad(value, length) {
    return (value.toString().length < length) ? pad(' ' + value, length) : value;
}