var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';
e.category = bu.CommandType.CAT;

e.execute = (msg) => {
    if (msg.author.id === bu.CAT_ID) {
        bu.emitter.emit('reloadConfig');
        bu.sendMessageToDiscord(msg.channel.id, ':ok_hand:');
    }
};