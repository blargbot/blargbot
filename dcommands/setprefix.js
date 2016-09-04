var e = module.exports = {}
var bu = require('./../util.js')

var bot
e.init = (Tbot) => {
    bot = Tbot
}
e.requireCtx = require

e.isCommand = true
e.hidden = false
e.usage = 'setprefix <prefix>';
e.info = 'Sets the command prefix.';
e.category = bu.CommandType.COMMANDER

e.execute = (msg, words, text) => {
   // if (bu.hasPerm(msg, 'Bot Commander')) {
        if (words.length > 1) {
            if (bu.config.discord.servers[msg.channel.guild.id] == null) {
                bu.config.discord.servers[msg.channel.guild.id] = {};
            }
            var prefix = text.replace(words[0], '').trim();
            bu.config.discord.servers[msg.channel.guild.id].prefix = prefix;
            bu.saveConfig();

            bu.sendMessageToDiscord(msg.channel.id, `Set command prefix to '${prefix}'`);
        } else {
            delete bu.config.discord.servers[msg.channel.guild.id].prefix;
            bu.saveConfig();
            bu.sendMessageToDiscord(msg.channel.id, `Reset your command prefix! It is now \`${bu.config.discord.defaultPrefix}\``);
        }
 //   }
}