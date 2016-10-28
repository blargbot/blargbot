var e = module.exports = {};

var moment = require('moment-timezone');


e.init = () => {
    
    

    e.category = bu.CommandType.GENERAL;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'uptime';
e.info = 'Tells you how long I have been online.';
e.longinfo = `<p>Tells you how long the bot has been up for.</p>`;

e.execute = (msg) => {
    bu.send(msg.channel.id, `Bot Uptime: ${bu.createTimeDiffString(moment(), bu.startTime)}`);
};