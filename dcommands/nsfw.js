var e = module.exports = {}
var bu = require('./../util.js')

var bot
e.init = (Tbot) => {
    bot = Tbot
}
e.requireCtx = require

e.isCommand = true
e.hidden = false
e.usage = 'nsfw';
e.info = 'Sets the current channel as NSFW';
e.category = bu.CommandType.COMMANDER

e.execute = (msg, words, text) => {
   // if (!bu.hasPerm(msg, 'Bot Commander')) {
   //     return;
  //  }
    if (!bu.config.discord.servers[msg.channel.guild.id])
        bu.config.discord.servers[msg.channel.guild.id] = {};
    if (!bu.config.discord.servers[msg.channel.guild.id].nsfw)
        bu.config.discord.servers[msg.channel.guild.id].nsfw = {};
    if (!bu.config.discord.servers[msg.channel.guild.id].nsfw[msg.channel.id]) {
        bu.config.discord.servers[msg.channel.guild.id].nsfw[msg.channel.id] = true;
        bu.sendMessageToDiscord(msg.channel.id, `Channel '${msg.channel.name}' is now NSFW.`);
    } else {
        bu.config.discord.servers[msg.channel.guild.id].nsfw[msg.channel.id] = false;
        bu.sendMessageToDiscord(msg.channel.id, `Channel '${msg.channel.name}' is no longer NSFW.`);
    }
    bu.saveConfig();
}