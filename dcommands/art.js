var e = module.exports = {};
var path = require('path');
var util = require('util');
const request = require('request');
const Jimp = require('jimp');

e.init = () => {
    e.category = bu.CommandType.GENERAL;
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
    bot.sendChannelTyping(msg.channel.id);
    try {
        request({
            uri: user.avatarURL,
            encoding: null
        }, async function(err, res, body) {
            let avatar = await Jimp.read(body);
            avatar.resize(370, 370);
            let foreground = await Jimp.read(path.join(__dirname, '..', 'img', `art.png`));
            let img = new Jimp(1364, 1534);
            img.composite(avatar, 903, 92);
            img.composite(avatar, 903, 860);
            img.composite(foreground, 0, 0);

            img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                bu.send(msg, undefined, {
                    file: buffer,
                    name: 'sobeautifulstan.png'
                });
            })
        });


    } catch (err) {
        logger.error(err);
    }
};