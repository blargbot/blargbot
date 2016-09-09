var e = module.exports = {};
var bu = require('./../util.js');
var util = require('util');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'modlog [disable]';
e.info = `Set's the current channel as the modlog channel.`;
e.category = bu.CommandType.ADMIN;

e.execute = (msg, words, text) => {

    if (words[1] == 'disable') {
        bu.guildSettings.remove(msg.channel.guild.id, 'modlog').then(fields => {
            bu.sendMessageToDiscord(msg.channel.id, 'Modlog disabled!');
        });
    } else {
        bu.guildSettings.set(msg.channel.guild.id, 'modlog', msg.channel.id).then(() => {
            bu.sendMessageToDiscord(msg.channel.id, 'Modlog channel set!');
        });
    }
};