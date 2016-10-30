var e = module.exports = {};



e.init = () => {
    
    

    e.category = bu.CommandType.CAT;

};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = (msg) => {
    if (msg.author.id == bu.CAT_ID) {
        if (config.discord.musicGuilds[msg.channel.guild.id]) {
            config.discord.musicGuilds[msg.channel.guild.id] = false;
            bu.send(msg, `Music disabled for ${msg.channel.guild.name}`);
        } else {
            config.discord.musicGuilds[msg.channel.guild.id] = true;
            bu.send(msg, `Music enabled for ${msg.channel.guild.name}`);
        }
    }
    bu.saveConfig();
};
