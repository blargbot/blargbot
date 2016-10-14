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
e.usage = 'patch <features> [ | <fixes> ]';
e.info = 'Makes a patch note';
var changeChannel = '222199986123833344';
e.execute = (msg, words) => {
    if (msg.author.id != bu.CAT_ID) {
        return;
    }
    words.shift();
    var message = words.join(' ');
    var args = message.split('|');
    message = `**Version ${bu.VERSION}**
${args[0] ?
`
**New Features:**
${args[0]}
` : ''}
${args[1] ?
`
**Bug Fixes:**
${args[1]}
` : ''}`;
    bu.sendMessageToDiscord(changeChannel, message);
};