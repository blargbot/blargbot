var e = module.exports = {};
const path = require('path');
const util = require('util');
const Jimp = require('jimp');
const fs = require('fs');
const GIFEncoder = require('gifencoder');
const request = require('request');

e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'triggered [user]';
e.info = `Shows everyone how triggered you are.`;
e.longinfo = `<p>Shows everyone how triggered you are.</p>`;

e.execute = async function(msg, words) {
    let user = msg.author;
    if (words[1]) {
        user = await bu.getUser(msg, words.slice(1).join(' '));
    }
    if (!user) return;
    await bot.sendChannelTyping(msg.channel.id);

    let code = bu.genEventCode();
    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'triggered',
        code: code,
        avatar: user.avatarURL
    });
    bu.send(msg, undefined, {
        file: buffer,
        name: 'triggered.gif'
    });
};