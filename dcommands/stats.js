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
    bu.sendMessageToDiscord(msg.channel.id, `\`\`\`xl
!== { Stats} ==!
Running on ${bot.guilds.size} guilds.
Running on ${Object.keys(bot.channelGuildMap).length} channels.
Serving ${bot.users.size} users.
Using ${bu.getMemoryUsage()}MiB RAM
Running for ${bu.createTimeDiffString(moment(), bu.startTime)}
Version: ${bu.VERSION}
\`\`\``);
}