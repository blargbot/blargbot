var e = module.exports = {};

var gm = require('gm');
var path = require('path');
var moment = require('moment');
var util = require('util');
const Jimp = require('jimp');

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'thesearch [text]';
e.info = `Tells everyone about the progress of the search for intelligent life.`;
e.longinfo = `<p>Tells everyone about the progress of the search for intelligent life.</p>`;

e.execute = async function(msg, words) {
    var shitText = 'I use betterdiscord';
    if (words[1]) shitText = words.slice(1).join(' ');
    shitText = await bu.filterMentions(shitText);
    logger.debug(util.inspect(words));
    bot.sendChannelTyping(msg.channel.id);
    try {
        let buf = await bu.createCaption({
            text: shitText,
            fill: '#393b3e',
            font: 'SFToontime.ttf',
            size: '160x68'
        })

        let text = await Jimp.read(buf);
        let img = await Jimp.read(path.join(__dirname, '..', 'img', `thesearch.png`));
        img.composite(text, 60, 331);

        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            bu.send(msg, undefined, {
                file: buffer,
                name: 'thesearch.png'
            });
        })
    } catch (err) {
        logger.error(err);
    }
};