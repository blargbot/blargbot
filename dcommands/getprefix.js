var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;

e.hidden = false;
e.usage = 'getprefix';
e.info = 'Gets the command prefix for the current guild.';
e.longinfo = `<p>Returns the command prefix for the current guild.</p>`;

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