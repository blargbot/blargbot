var e = module.exports = {}
var bu = require('./../util.js')
var tags = require('./../tags');

var bot
e.init = (Tbot) => {
    bot = Tbot
}
e.requireCtx = require

e.isCommand = true
e.hidden = false
e.usage = 'farewell [message]';
e.info = 'Sets a farewell message for when users leave.';
e.category = bu.CommandType.COMMANDER

e.execute = (msg, words, text) => {
 //   if (!bu.hasPerm(msg, 'Bot Commander')) {
 //       return;
  //  }
    if (bu.config.discord.servers[msg.channel.guild.id] == null) {
        bu.config.discord.servers[msg.channel.guild.id] = {};
    }

    if (words.length == 1) {
        delete bu.config.discord.servers[msg.channel.guild.id].farewell;
        bu.sendMessageToDiscord(msg.channel.id, 'Disabled farewells');
        bu.saveConfig();
        return;
    }

    bu.config.discord.servers[msg.channel.guild.id].farewell = text.replace(`${words[0]} `, '');
    bu.sendMessageToDiscord(msg.channel.id, `Farewell set. Simulation:
${tags.processTag(msg, bu.config.discord.servers[msg.channel.guild.id].farewell, '')}`);
    bu.saveConfig();
}