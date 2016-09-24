var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'version';
e.info = 'Tells you what version I am on';
e.longinfo = `<p>Tells you what version the bot is currently running on.</p>`;

e.execute = (msg) => {
    bu.sendMessageToDiscord(msg.channel.id, `I am running blargbot version ${bu.VERSION}!`);

};