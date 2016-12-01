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
e.usage = 'shit <text> [flags]';
e.info = `Tells everyone what's shit.`;
e.longinfo = `<p>Tells everyone what's shit. Use <code>-p</code> as the first argument to specify the text as plural.</p>`;

e.flags = [{
    flag: 'p',
    word: 'plural',
    desc: 'Whether or not the text is plural (use ARE instead of IS).'
}]

e.execute = async function(msg, words) {
    let input = bu.parseInput(e.flags, words);
    var shitText = 'Your favourite anime';
    var plural = false;
    if (input.p) plural = true;
    shitText = await bu.filterMentions(input.undefined.join(' '));
    bot.sendChannelTyping(msg.channel.id);
    try {
        gm()
            .command('convert')
            .font(path.join(__dirname, '..', 'img/fonts/animeace.ttf'))
            .rawSize(200, 160)
            .out('-background')
            .out('transparent')
            .fill('#000000')
            .gravity('South')
            .out(`caption:${shitText}`)
            .options({
                imageMagick: true
            }).toBuffer('PNG', async function(err, buf) {
                let text = await Jimp.read(buf);
                let img = await Jimp.read(path.join(__dirname, '..', 'img', `SHIT${plural ? 'S' : ''}.png`));
                img.composite(text, 810, 31);

                img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                        bu.send(msg, undefined, {
                            file: buffer,
                            name: 'SHIT.png'
                        });
                    })
                    //     bu.send(msg, undefined, {
                    //          file: buffer,
                    //           name: 'SHIT.png'
                    //       });
            })
            /*
                    let text = new Jimp(1000, 1000);
                    let font = await Jimp.loadFont(path.join(__dirname, '..', 'img', 'fonts', `animeace.fnt`));
                    text.print(font, 0, 0, shitText, 400, Jimp.ALIGN_FONT_CENTER);
                    let height = text.clone().autocrop().bitmap.height + 15;
                    text.crop(0, 0, 400, height).resize(200, Jimp.AUTO);
                    //.autocrop();
                    logger.debug(text.bitmap.height, text.bitmap.width);
                    let height2 = text.bitmap.height;
                    let index = 1;
                    while (text.bitmap.height > 200) {
                        let diff = (height2 - 200) * index;
                        text = undefined;
                        text = new Jimp(1000, 1000);

                        text.print(font, 0, 0, shitText, 400 + diff, Jimp.ALIGN_FONT_CENTER);
                        let height = text.clone().autocrop().bitmap.height + 15;

                        text.crop(0, 0, 400 + diff, height).resize(200, Jimp.AUTO);
                        //.autocrop();
                        logger.debug(text.bitmap.height, diff);
                        index++;
                    }
                    let img = await Jimp.read(path.join(__dirname, '..', 'img', `SHIT${plural ? 'S' : ''}.png`));
                    img.composite(text, 810, 31 + (170 - text.bitmap.height));

                    img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                        bu.send(msg, undefined, {
                            file: buffer,
                            name: 'SHIT.png'
                        });
                    });
                    //            });

            */
    } catch (err) {
        logger.error(err);
    }
};