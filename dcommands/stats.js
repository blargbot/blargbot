var e = module.exports = {};
var bu = require('./../util.js');
var moment = require('moment-timezone');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'stats';
e.info = 'Gives you some information about me';
e.longinfo = `<p>Gives you information about the bot.</p>`;
e.category = bu.CommandType.GENERAL;

e.execute = (msg) => {
    bu.sendMessageToDiscord(msg.channel.id, `\`\`\`prolog
!== { Stats } ==!
${pad('Guilds:', 10)} ${bot.guilds.size}
${pad('Channels:', 10)} ${Object.keys(bot.channelGuildMap).length}
${pad('Users:', 10)} ${bot.users.size}
${pad('RAM:', 10)} ${bu.getMemoryUsage()}MiB
${pad('Uptime:', 10)} ${bu.createTimeDiffString(moment(), bu.startTime)}
${pad('Version:', 10)} ${bu.VERSION}
\`\`\``);
};


function pad(value, length) {
    return (value.toString().length < length) ? pad(' ' + value, length) : value;
}