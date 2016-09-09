var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'version';
e.info = 'Tells you what version I am on';
e.category = bu.CommandType.GENERAL;

e.execute = (msg) => {
    bu.sendMessageToDiscord(msg.channel.id, `I am running blargbot version ${bu.VERSION}!`);

};