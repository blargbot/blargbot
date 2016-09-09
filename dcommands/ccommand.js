var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'ccommand <command name> <command content>';
e.info = 'Creates a custom command.';
e.category = bu.CommandType.COMMANDER;

e.execute = (msg, words, text) => {
    //  if (!bu.hasPerm(msg, "Bot Commander")) {
    //      return;
    //   }

    if (words.length == 1) {
        bu.sendMessageToDiscord(msg.channel.id, `Do \`help\` for a list of commands.
See http://ratismal.github.io/blargbot/commands.html#ccommand for usage instructions.`);
        return;
    }

    if (words[1].toLowerCase() === 'ccommand') {
        bu.sendMessageToDiscord(msg.channel.id, `You cannot overwrite \`ccommand\``);
        return;
    }
    if (words.length == 2) {
        bu.ccommand.remove(msg.channel.guild.id, words[1]).then(fields => {
            if (fields.affectedRows > 0)
                bu.sendMessageToDiscord(msg.channel.id, `Deleted command ${words[1]}`);
            else
                bu.sendMessageToDiscord(msg.channel.id, `Command ${words[1]} does not exist.`);

        });
    } else {
        bu.ccommand.set(msg.channel.guild.id, words[1], text.replace(`${words[0]} ${words[1]} `, '')).then(() => {
            bu.sendMessageToDiscord(msg.channel.id, `Set command ${words[1]}`);            
        });
    }
   // bu.saveConfig();
};