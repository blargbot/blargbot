var e = module.exports = {};
var path = require('path');
var util = require('util');
const Jimp = require('jimp');
const fs = require('fs');
const GIFEncoder = require('gifencoder');

e.init = () => {
    e.category = bu.CommandType.GENERAL;
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
    bot.sendChannelTyping(msg.channel.id);
    try {
        let frameCount = 4;
        let frames = [];

        let avatar = await Jimp.read(user.avatarURL);
        avatar.resize(320, 320)
        let triggered = await Jimp.read(path.join(__dirname, '..', 'img', `triggered.png`))
        triggered.resize(200, 30);
        let buffers = [];
        let encoder = new GIFEncoder(256, 256);
        let stream = encoder.createReadStream();

        stream.on('data', function(buffer) {
            buffers.push(buffer);
        });
        stream.on('end', function() {
            let buffer = Buffer.concat(buffers);
            bu.send(msg, undefined, {
                file: buffer,
                name: 'TRIGGERED.gif'
            });
        });


        let base = new Jimp(256, 256);

        // for (let i = 0; i < frameCount; i++) {
        let temp = base.clone();
        let x = -32 + (bu.getRandomInt(-16, 16));
        let y = -32 + (bu.getRandomInt(-16, 16));
        temp.composite(avatar, x, y);
        x = 28 + (bu.getRandomInt(-4, 4));
        y = 210 + (bu.getRandomInt(-4, 4));
        temp.composite(triggered, x, y);
        frames.push(temp.bitmap.data);

        temp = base.clone();
        x = -32 + (bu.getRandomInt(-16, 16));
        y = -32 + (bu.getRandomInt(-16, 16));
        temp.composite(avatar, x, y);
        x = 28 + (bu.getRandomInt(-4, 4));
        y = 210 + (bu.getRandomInt(-4, 4));
        temp.composite(triggered, x, y);
        frames.push(temp.bitmap.data);

        temp = base.clone();
        x = -32 + (bu.getRandomInt(-16, 16));
        y = -32 + (bu.getRandomInt(-16, 16));
        temp.composite(avatar, x, y);
        x = 28 + (bu.getRandomInt(-4, 4));
        y = 210 + (bu.getRandomInt(-4, 4));
        temp.composite(triggered, x, y);
        frames.push(temp.bitmap.data);

        temp = base.clone();
        x = -32 + (bu.getRandomInt(-16, 16));
        y = -32 + (bu.getRandomInt(-16, 16));
        temp.composite(avatar, x, y);
        x = 28 + (bu.getRandomInt(-4, 4));
        y = 210 + (bu.getRandomInt(-4, 4));
        temp.composite(triggered, x, y);
        frames.push(temp.bitmap.data);

        setTimeout(function() {
            encoder.start();
            encoder.setRepeat(0);
            encoder.setDelay(20);
            for (let frame of frames) encoder.addFrame(frame);
            encoder.finish();
        }, 500);

        //}
        bu.send(msg, 'done')
    } catch (err) {
        logger.error(err);
    }
};