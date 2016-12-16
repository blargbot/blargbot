var gm = require('gm');
var path = require('path');
var fs = require('fs');
var moment = require('moment');

var e = module.exports = {};
e.init = () => {
    e.category = bu.CommandType.IMAGE;
};
e.requireCtx = require;

e.isCommand = true;

e.hidden = false;
e.usage = 'free <caption> [flags]';
e.info = 'Tells everyone what you got for free';
e.longinfo = `<p>Tells everyone what you got for free.</p>`;

e.flags = [
    {flag: 'b', word: 'bottom', desc: 'The bottom caption.'}
]

e.execute = async function(msg, words, text) {
    let input = bu.parseInput(e.flags, words);
    if (input.undefined.length == 0) {
        bu.send(msg, `Usage: \`${e.usage}\``);
        return;
    }
    bot.sendChannelTyping(msg.channel.id);
    
    let code = bu.genEventCode();
    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'free',
        top: input.undefined.join(' '),
        bottom: input.b ? input.b.join(' ') : undefined
    });
    bu.send(msg, undefined, {
        file: buffer,
        name: 'FREEFREEFREE.gif'
    });
};
