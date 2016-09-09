var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'getprefix';
e.info = 'Gets the command prefix for the current guild.';
e.category = bu.CommandType.GENERAL;

e.execute = (msg) => {
    bu.guildSettings.get(msg.channel.guild.id, 'prefix').then(prefix => {
        if (prefix)
            bu.sendMessageToDiscord(msg.channel.id, `My prefix on ${msg.channel.guild.name} is \`${prefix}\`.
You can also use \`${bu.config.discord.defaultPrefix}\`, \`blargbot\`, or mentions.`);
        else
            bu.sendMessageToDiscord(msg.channel.id, `I have no custom prefix on ${msg.channel.guild.name}.
You can use \`${bu.config.discord.defaultPrefix}\`, \`blargbot\`, or mentions.`);
    });
};