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
}];

e.execute = async function(msg, words) {
    let input = bu.parseInput(e.flags, words);
    let user = msg.author;
    if (input.undefined.length > 0) {
        user = await bu.getUser(msg, input.undefined.join(' '));
    }
    if (!user) return;
    await bot.sendChannelTyping(msg.channel.id);
    let inverted = input.i != undefined;
    let horizontal = input.h != undefined;
    let vertical = input.v != undefined;
    let sepia = input.s != undefined;
    let blur = input.b != undefined;

    let code = bu.genEventCode();   
    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'triggered',
        code: code,
        avatar: user.avatarURL,
        inverted,
        horizontal,
        vertical,
        sepia,
        blur
    });
    bu.send(msg, undefined, {
        file: buffer,
        name: 'triggered.gif'
    });
};