var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.CAT;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = (msg) => {
    if (msg.author.id === bu.CAT_ID) {
        bu.emitter.emit('reloadConfig');
        bu.sendMessageToDiscord(msg.channel.id, ':ok_hand:');
    }
};