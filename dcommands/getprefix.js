var e = module.exports = {}
var bu = require('./../util.js')

var bot
e.init = (Tbot) => {
    bot = Tbot
}
e.requireCtx = require

e.isCommand = true
e.hidden = false
e.usage = 'getprefix';
e.info = 'Gets the command prefix for the current guild.';
e.category = bu.CommandType.GENERAL

e.execute = (msg, words, text) => {
    if (bu.config.discord.servers && bu.config.discord.servers[msg.channel.guild.id] && bu.config.discord.servers[msg.channel.guild.id].prefix) {
        bu.sendMessageToDiscord(msg.channel.id, `My prefix on ${msg.channel.guild.name} is \`${bu.config.discord.servers[msg.channel.guild.id].prefix}\`.`)
    } else {
        bu.sendMessageToDiscord(msg.channel.id, `My prefix on ${msg.channel.guild.name} is \`${bu.config.discord.defaultPrefix}\`.`)
    }
}