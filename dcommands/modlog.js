var e = module.exports = {}
var bu = require('./../util.js')
var util = require('util')

var bot
e.init = (Tbot) => {
    bot = Tbot
}

e.requireCtx = require

e.isCommand = true;
e.hidden = false
e.usage = 'modlog [disable]';
e.info = `Set's the current channel as the modlog channel.`;
e.category = bu.CommandType.ADMIN;

e.execute = (msg, words, text) => {
    // if (msg.channel.guild.members.get(bot.user.id).permission.)
    if (!bu.config.discord.servers[msg.channel.guild.id])
        bu.config.discord.servers[msg.channel.guild.id] = {}

    if (words[1] == 'disable') {
        if (bu.config.discord.servers[msg.channel.guild.id].modlog) {
            delete bu.config.discord.servers[msg.channel.guild.id].modlog
            bu.sendMessageToDiscord(msg.channel.id, 'Modlog disabled!')
        } else {
            bu.sendMessageToDiscord(msg.channel.id, 'Modlog was not active.')            
        }
    } else {
        bu.config.discord.servers[msg.channel.guild.id].modlog = msg.channel.id
        bu.sendMessageToDiscord(msg.channel.id, 'Modlog channel set!')
    }
    bu.saveConfig()
}