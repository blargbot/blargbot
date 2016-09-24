var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

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
        var prefix = text.replace(words[0], '').trim();
        bu.guildSettings.set(msg.channel.guild.id, 'prefix', prefix).then(() => {
            bu.sendMessageToDiscord(msg.channel.id, `Set the custom command prefix to '${prefix}'`);
        });
    } else {
        bu.guildSettings.remove(msg.channel.guild.id, 'prefix').then(() => {
            bu.sendMessageToDiscord(msg.channel.id, `Reset your command prefix!`);
        });

    }
    //   }
};