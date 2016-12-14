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

e.isCommand = false;
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
        let avatar = await Jimp.read(user.avatarURL);
        avatar.resize(640, 640)
            //  let avatarBuffer = await getImageBuffer(avatar)
            //  logger.debug('meow', avatarBuffer)
        let triggered = await Jimp.read(path.join(__dirname, '..', 'img', `triggered.png`))

        let buffers = [];
        let encoder = new GIFEncoder(512, 512);
        let stream = encoder.createReadStream();
        //   encoder.createReadStream().pipe(fs.createWriteStream(path.join('..', 'myanimated.gif')));
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

        encoder.start();
        encoder.setRepeat(0);
        encoder.setDelay(20);
        let base = new Jimp(512, 512);

        for (let i = 0; i < 4; i++) {
            let temp = base.clone();
            let x = -64 + (bu.getRandomInt(-32, 32));
            let y = -64 + (bu.getRandomInt(-32, 32));
            temp.composite(avatar, x, y);
            x = 56 + (bu.getRandomInt(-8, 8));
            y = 420 + (bu.getRandomInt(-8, 8));
            temp.composite(triggered, x, y);
     //       encoder.addFrame(temp.bitmap.data);
        }
        encoder.finish();
    } catch (err) {
        logger.error(err);
    }
};

function getImageBuffer(image) {
    return new Promise((fulfill, reject) => {
        image.getBuffer(Jimp.MIME_PNG, (err, buf) => {
            if (err) {
                reject(err);
                return;
            }
            fulfill(buf);
        })
    });
}
