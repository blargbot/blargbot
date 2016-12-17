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
e.usage = 'art [user]';
e.info = `Shows everyone a work of art.`;
e.longinfo = `<p>Shows everyone a work of art.</p>`;

e.execute = async function(msg, words) {
    let user = msg.author;
    if (words[1]) {
        user = await bu.getUser(msg, words.slice(1).join(' '));
    }
    if (!user) return;
    bot.sendChannelTyping(msg.channel.id);

    let code = bu.genEventCode();
    
    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'art',
        code: code,
        avatar: user.avatarURL
    });
    
    bu.send(msg, undefined, {
        file: buffer,
        name: 'sobeautifulstan.png'
    });
};