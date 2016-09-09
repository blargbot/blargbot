var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = true;
e.usage = '';
e.info = '';
e.category = bu.CommandType.GENERAL;

e.execute = (msg, words, text) => {
    if (msg.channel.id === config.discord.channel) {
        bu.reloadUserList();
        bu.sendMessageToDiscord(msg.channel.id, 'Reloaded the user list! Check the channel topic.');
    }
};