var e = module.exports = {};
var bu;
var moment = require('moment-timezone');

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'uptime';
e.info = 'Tells you how long I have been online.';
e.longinfo = `<p>Tells you how long the bot has been up for.</p>`;

e.execute = (msg) => {
    bu.sendMessageToDiscord(msg.channel.id, `Bot Uptime: ${bu.createTimeDiffString(moment(), bu.startTime)}`);
};