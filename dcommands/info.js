var e = module.exports = {}
var bu = require('./../util.js')

var bot
e.init = (Tbot) => {
    bot = Tbot
}
e.requireCtx = require

e.isCommand = true
e.hidden = false
e.usage = 'info';
e.info = 'Returns some info about me.';
e.category = bu.CommandType.GENERAL

e.execute = (msg, words, text) => {
    bu.sendMessageToDiscord(msg.channel.id, `blargbot is a multipurpose bot with new features implemented regularly, written in javascript using Eris.
http://ratismal.github.io/blargbot/
\`\`\`diff
!== { Stats} ==!
+ running on ${bu.bot.guilds.size} guilds.
+ running on ${Object.keys(bu.bot.channelGuildMap).length} channels.
+ serving ${bu.bot.users.size} users.
+ using ${bu.getMemoryUsage()}MiB RAM
- current version: ${bu.VERSION}
\`\`\`
For commands, do \`help\``);
}