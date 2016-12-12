var e = module.exports = {};

var gm = require('gm');
var path = require('path');
var moment = require('moment');
var util = require('util');
const reload = require('require-reload');
const Jimp = reload('jimp');

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'retarded <text> [flags]';
e.info = `Tells everyone who is retarded.`;
e.longinfo = `<p>Tells everyone who is retarded</p>`;

e.flags = [{
    flag: 'u',
    word: 'user',
    desc: 'The person who is retarded. If unset, it defaults to you!'
}]

e.execute = async function(msg, words) {
    let input = bu.parseInput(e.flags, words);
    if (input.undefined.length == 0) {
        bu.send(msg, 'Not enough input!');
        return;
    }
    let user;
    if (input.u) {
        user = await bu.getUser(msg, input.u.join(' '));
    }
    let quote = await bu.filterMentions(input.undefined.join(' '));
    let body;
    if (user)
        body = (await bu.request({
            uri: user.avatarURL,
            encoding: null
        })).body;
    bot.sendChannelTyping(msg.channel.id);
    try {

        let buf = await bu.createCaption({
            font: 'ARCENA.ttf',
            fill: 'black',
            stroke: 'white',
            strokewidth: 5,
            text: quote,
            size: '272x60'
        });


        let text = await Jimp.read(buf);
        let img = await Jimp.read(path.join(__dirname, '..', 'img', `retarded.png`));
        if (body) {
            let avatar = await Jimp.read(body);
            let smallAvatar = avatar.clone();
            smallAvatar.resize(74, 74);
            img.composite(smallAvatar, 166, 131);
            avatar.resize(171, 171);
            avatar.rotate(18)
            img.composite(avatar, 277, 32);
        }
        img.composite(text, 268, 0);
        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            bu.send(msg, undefined, {
                file: buffer,
                name: 'SHIT.png'
            });
        })
    } catch (err) {
        logger.error(err);
    }
};