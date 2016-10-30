var e = module.exports = {};



e.init = () => {
    
    

    e.category = bu.CommandType.COMMANDER;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'setprefix [prefix]';
e.info = 'Sets the command prefix.';
e.longinfo = `<p>Sets the custom command prefix for the guild. You can set it to anything. If no prefix is specified, disables the custom prefix.</p>`;

e.execute = (msg, words, text) => {
    if (words.length > 1) {
        var prefix = words.slice(1).join(' ');
        bu.guildSettings.set(msg.channel.guild.id, 'prefix', prefix).then(() => {
            bu.send(msg, `Set the custom command prefix to '${prefix}'`);
        });
    } else {
        bu.guildSettings.remove(msg.channel.guild.id, 'prefix').then(() => {
            bu.send(msg, `Reset your command prefix!`);
        });

    }
    //   }
};