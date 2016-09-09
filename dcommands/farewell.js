var e = module.exports = {};
var bu = require('./../util.js');
var tags = require('./../tags');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'farewell [message]';
e.info = 'Sets a farewell message for when users leave.';
e.category = bu.CommandType.COMMANDER;

e.execute = (msg, words, text) => {

    if (words.length == 1) {
        bu.guildSettings.remove(msg.channel.guild.id, 'farewell').then(fields => {
            bu.sendMessageToDiscord(msg.channel.id, 'Disabled farewells');
        });
        return;
    }
    var farewell = text.replace(`${words[0]} `, '');
    bu.guildSettings.set(msg.channel.guild.id, 'farewell', farewell).then(() => {
        bu.sendMessageToDiscord(msg.channel.id, `Farewell set. Simulation:
${tags.processTag(msg, farewell, '')}`);
    });
};