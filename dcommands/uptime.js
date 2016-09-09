var e = module.exports = {};
var bu = require('./../util.js');
var moment = require('moment-timezone');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'uptime';
e.info = 'Tells you how long I have been up';
e.category = bu.CommandType.GENERAL;

e.execute = (msg, words, text) => {
    bu.sendMessageToDiscord(msg.channel.id, `Bot Uptime: ${bu.createTimeDiffString(moment(), bu.startTime)}`);
};