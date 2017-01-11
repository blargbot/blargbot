var e = module.exports = {};
var path = require('path');
var util = require('util');
const request = require('request');
const Jimp = require('jimp');

e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'clint [user]';
e.info = `I don't even know, to be honest.`;
e.longinfo = `<p>I don't even know, to be honest.</p>`;

e.flags = [{
    flag: 'I',
    word: 'image',
    desc: 'A custom image.'
}];

e.execute = async function(msg, words) {
    let input = bu.parseInput(e.flags, words);
    let user = msg.author;
    let url;
    if (msg.attachments.length > 0) {
        url = msg.attachments[0].url; 
    } else if (input.I) {
        url = input.I.join(' ');
    } else if (input.undefined.length > 0) {
        user = await bu.getUser(msg, input.undefined.join(' '));
        if (!user) return;
        url = user.avatarURL;
    }
    if (!url) url = msg.author.avatarURL;
    bot.sendChannelTyping(msg.channel.id);

    let code = bu.genEventCode();

    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'clint',
        code: code,
        avatar: url
    });

    bu.send(msg, undefined, {
        file: buffer,
        name: 'clint.png'
    });
};