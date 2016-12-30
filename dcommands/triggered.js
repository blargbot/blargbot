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

e.flags = [{
    flag: 'i',
    word: 'invert',
    desc: 'Inverts the image.'
}, {
    flag: 'h',
    word: 'horizontal',
    desc: 'Flips the image horizontally.'
}, {
    flag: 'v',
    word: 'vertical',
    desc: 'Flips the image vertically.'
}, {
    flag: 's',
    word: 'sepia',
    desc: 'Applies a sepia filter.'
}, {
    flag: 'b',
    word: 'blur',
    desc: 'Applies a blur.'
}, {
    flag: 'g',
    word: 'greyscale',
    desc: 'Makes the image greyscale'
}, {
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
    await bot.sendChannelTyping(msg.channel.id);
    let inverted = input.i != undefined;
    let horizontal = input.h != undefined;
    let vertical = input.v != undefined;
    let sepia = input.s != undefined;
    let blur = input.b != undefined;
    let greyscale = input.g != undefined;

    let code = bu.genEventCode();
    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'triggered',
        code: code,
        avatar: url,
        inverted,
        horizontal,
        vertical,
        sepia,
        blur,
        greyscale
    });
    bu.send(msg, undefined, {
        file: buffer,
        name: 'triggered.gif'
    });
};