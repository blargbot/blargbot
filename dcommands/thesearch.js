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
e.usage = 'thesearch [text]';
e.info = `Tells everyone about the progress of the search for intelligent life.`;
e.longinfo = `<p>Tells everyone about the progress of the search for intelligent life.</p>`;

e.execute = async function(msg, words) {
    var shitText = 'I use betterdiscord';
    if (words[1]) shitText = words.slice(1).join(' ');
    logger.debug(util.inspect(words));
    bot.sendChannelTyping(msg.channel.id);
    try {
        gm()
            .command('convert')
            .font(path.join(__dirname, '..', 'img/fonts/comicjens.ttf'))
            .rawSize(160, 68)
            .out('-background')
            .out('transparent')
            .fill('#393b3e')
            .gravity('Center')
            .out(`caption:${shitText}`)
            .options({
                imageMagick: true
            }).toBuffer('PNG', async function(err, buf) {
                let text = await Jimp.read(buf);
                let img = await Jimp.read(path.join(__dirname, '..', 'img', `thesearch.png`));
                img.composite(text, 60, 331);

                img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                    bu.send(msg, undefined, {
                        file: buffer,
                        name: 'SHIT.png'
                    });
                })
            })
    } catch (err) {
        logger.error(err);
    }
};