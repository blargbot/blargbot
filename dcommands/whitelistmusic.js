var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';
e.category = bu.CommandType.CAT;

e.execute = (msg) => {
    if (msg.author.id == bu.CAT_ID) {
        if (bu.config.discord.musicGuilds[msg.channel.guild.id]) {
            bu.config.discord.musicGuilds[msg.channel.guild.id] = false;
            bu.sendMessageToDiscord(msg.channel.id, `Music disabled for ${msg.channel.guild.name}`);
        } else {
            bu.config.discord.musicGuilds[msg.channel.guild.id] = true;
            bu.sendMessageToDiscord(msg.channel.id, `Music enabled for ${msg.channel.guild.name}`);
        }
    }
    bu.saveConfig();
};
