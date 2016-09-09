var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'patch <features> [ | <fixes> ]';
e.info = 'Makes a patch note';
e.category = bu.CommandType.CAT;
var changeChannel = '222199986123833344';
e.execute = (msg, words, text) => {
    if (msg.author.id != bu.CAT_ID) {
        return;
    }
    words.shift();
    var message = words.join(' ');
    var args = message.split('|');
    message = `**Version ${bu.VERSION}**

**New Features:**
${args[0]}
${args[1] ?
            `
**Bug Fixes:**
${args[1]}
` : ''}`;
    bu.sendMessageToDiscord(changeChannel, message);
};