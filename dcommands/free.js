var gm = require('gm');
var path = require('path');
var fs = require('fs');
var moment = require('moment');

var e = module.exports = {};
e.init = () => {
    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;

e.hidden = false;
e.usage = 'free <caption> [ | <lower caption>]';
e.info = 'Tells everyone what you got for free';
e.longinfo = `<p>Tells everyone what you got for free.</p>`;

e.execute = function (msg, words, text) {
    if (words.length == 1) {
        bu.send(msg, 'Usage: `free <caption> [ | <lower caption>]`');
        return;
    }
    text = words.slice(1).join(' ');
    bot.sendChannelTyping(msg.channel.id);

    //  return new promise((fulfill, reject) => {
    var cap1 = '';
    var cap2;
    if (text.indexOf('|') > -1) {
        cap1 = text.split('|')[0].trim();
        cap2 = text.split('|')[1].trim();
    } else {
        cap1 = text;
    }
    var timestamp = moment().format().replace(/:/gi, '_');
    logger.info(`Generating image for text '${text}'`);

    e.generateCaption(timestamp, cap1, () => {
        e.generateLowerCaption(timestamp, cap2, () => {
            e.generateFrame(timestamp, 0, () => {
                e.generateFrame(timestamp, 1, () => {
                    e.generateFrame(timestamp, 2, () => {
                        e.generateFrame(timestamp, 3, () => {
                            e.generateFrame(timestamp, 4, () => {
                                e.generateFrame(timestamp, 5, () => {
                                    e.generateFinalImage(timestamp, msg.channel.id);
                                    // logger.(2, image)
                                    // fulfill(image);
                                });
                            });
                        });
                    });
                });
            });

        });
    });
    // });

};


e.generateFinalImage = function (timestamp, channelid) {
    gm()
        .in(path.join(__dirname, '..', `img/generated/freefreefreetest0-${timestamp}.png`))
        .in(path.join(__dirname, '..', `img/generated/freefreefreetest1-${timestamp}.png`))
        .in(path.join(__dirname, '..', `img/generated/freefreefreetest2-${timestamp}.png`))
        .in(path.join(__dirname, '..', `img/generated/freefreefreetest3-${timestamp}.png`))
        .in(path.join(__dirname, '..', `img/generated/freefreefreetest4-${timestamp}.png`))
        .in(path.join(__dirname, '..', `img/generated/freefreefreetest5-${timestamp}.png`))
        .loop('0')
        .delay('4')
        .toBuffer('GIF', (err, buf) => {
            if (err) throw err;
            bot.createMessage(channelid, 'It really works!', {
                name: 'FREE.gif',
                file: buf
            });
            try {
                fs.unlink(path.join(__dirname, '..', `img/generated/freefreefreetest0-${timestamp}.png`));
                fs.unlink(path.join(__dirname, '..', `img/generated/freefreefreetest1-${timestamp}.png`));
                fs.unlink(path.join(__dirname, '..', `img/generated/freefreefreetest2-${timestamp}.png`));
                fs.unlink(path.join(__dirname, '..', `img/generated/freefreefreetest3-${timestamp}.png`));
                fs.unlink(path.join(__dirname, '..', `img/generated/freefreefreetest4-${timestamp}.png`));
                fs.unlink(path.join(__dirname, '..', `img/generated/freefreefreetest5-${timestamp}.png`));
                fs.unlink(path.join(__dirname, '..', `img/generated/freefreefreeCaption-${timestamp}.png`));
                fs.unlink(path.join(__dirname, '..', `img/generated/freefreefreeLowerCaption-${timestamp}.png`));
            } catch (err) {
                logger.error(err);
            }
        });
};

e.generateCaption = function (timestamp, text, callback) {
    gm()
        .command('convert')
        .font(path.join(__dirname, '..', 'img/fonts/impact.ttf'))
        .rawSize(380, 100)
        .out('-background')
        .out('transparent')
        .stroke('#000000')
        .strokeWidth(text.length > 40 ? 1 : 2)
        .fill('#ffffff')
        .gravity('North')
        .out(`caption:${text}`)
        .options({
            imageMagick: true
        })
        .write(path.join(__dirname, '..', `img/generated/freefreefreeCaption-${timestamp}.png`), function (err) {
            if (err) throw err;
            callback();
        });
};

e.generateLowerCaption = function (timestamp, text, callback) {
    gm()
        .command('convert')
        .font(path.join(__dirname, '..', 'img/fonts/arialdb.ttf'))
        .rawSize(380, 70)
        .out('-background')
        .out('transparent')
        .fill('#ffffff')
        .gravity('Center')
        .out(`caption:${text ? text : `CLICK HERE TO\nFIND OUT HOW`}`)
        .options({
            imageMagick: true
        })
        .write(path.join(__dirname, '..', `img/generated/freefreefreeLowerCaption-${timestamp}.png`), function (err) {
            if (err) throw err;
            callback();
        });
};

e.generateFrame = function (timestamp, iteration, callback) {
    gm(path.join(__dirname, '..', `img/freefreefree${iteration < 3 ? 0 : 1}.png`))
        .composite(path.join(__dirname, '..', `img/generated/freefreefreeCaption-${timestamp}.png`))
        .geometry(`${iteration == 0 ? `+10+5` : `+${getRandomInt(-10, 20)}+${getRandomInt(0, 20)}`}`)
        .write(path.join(__dirname, '..', `img/generated/freefreefreetest${iteration}-${timestamp}.png`), function (err) {
            if (err) throw err;
            gm(path.join(__dirname, '..', `img/generated/freefreefreetest${iteration}-${timestamp}.png`))
                .composite(path.join(__dirname, '..', `img/generated/freefreefreeLowerCaption-${timestamp}.png`))
                .geometry(`+10+228`)
                .write(path.join(__dirname, '..', `img/generated/freefreefreetest${iteration}-${timestamp}.png`), function (err) {
                    if (err) throw err;
                    callback();
                });
        });
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}