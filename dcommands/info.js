var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'info';
e.info = 'Returns some info about me.';
e.category = bu.CommandType.GENERAL;

e.execute = (msg, words, text) => {
    bu.sendMessageToDiscord(msg.channel.id, `blargbot is a multipurpose bot with new features implemented regularly, written in javascript using Eris.
http://blarg.stupidcat.me
\`\`\`xl
!== { Stats } ==!
Running on ${bu.bot.guilds.size} guilds.
Running on ${Object.keys(bu.bot.channelGuildMap).length} channels.
Serving ${bu.bot.users.size} users.
Using ${bu.getMemoryUsage()}MiB RAM
Version: ${bu.VERSION}
\`\`\`
For commands, do \`help\`. For information about supporting me, do \`donate\``);
};