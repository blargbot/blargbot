var e = module.exports = {}
var bu = require('./../util.js')

var bot
e.init = (Tbot) => {
    bot = Tbot
}

e.isCommand = true
e.hidden = false
e.usage = '';
e.info = '';
e.category = bu.CommandType.COMMANDER;

e.execute = (msg, words, text) => {
  //  if (bu.hasPerm(msg, 'Bot Commander')) {
        if (bu.config.discord.blacklist[msg.channel.id]) {
            //if (bu.config.discord.blacklist[msg.channel.id]) {
            bu.sendMessageToDiscord(msg.channel.id, `Channel **${msg.channel.name}** is no longer blacklisted.`)
            bu.config.discord.blacklist[msg.channel.id] = false;
            // }
        } else {
            bu.sendMessageToDiscord(msg.channel.id, `Channel **${msg.channel.name}** is now blacklisted.`)
            bu.config.discord.blacklist[msg.channel.id] = true;

        }
        bu.saveConfig();
 //   }
}