var e = module.exports = {}
var bu = require('./../util.js')
var moment = require('moment-timezone')

var bot
e.init = (Tbot) => {
    bot = Tbot
}
e.requireCtx = require

e.isCommand = true
e.hidden = false
e.usage = 'stats';
e.info = 'Gives you some information about me';
e.category = bu.CommandType.GENERAL

e.execute = (msg, words, text) => {
    bu.sendMessageToDiscord(msg.channel.id, `\`\`\`diff
!== { Stats} ==!
+ running on ${bot.guilds.size} guilds.
+ running on ${Object.keys(bot.channelGuildMap).length} channels.
+ serving ${bot.users.size} users.
+ using ${bu.getMemoryUsage()}MiB RAM
+ running for ${bu.createTimeDiffString(moment(), bu.startTime)}
- current version: ${bu.VERSION}
\`\`\``);
}