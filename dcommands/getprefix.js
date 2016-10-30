var e = module.exports = {};



e.init = () => {
    
    

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
            bu.send(msg, `My prefix on ${msg.channel.guild.name} is \`${prefix}\`.
You can also use \`${config.discord.defaultPrefix}\`, \`blargbot\`, or mentions.`);
        else
            bu.send(msg, `I have no custom prefix on ${msg.channel.guild.name}.
You can use \`${config.discord.defaultPrefix}\`, \`blargbot\`, or mentions.`);
    });
};