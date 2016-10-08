var e = module.exports = {};
var bu;
var gm = require('gm');
var path = require('path');
var moment = require('moment');
var util = require('util');
var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;

};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'shit [-p] <text>';
e.info = `Tells everyone what's shit. Use -p as the first argument to specify the text is plural.`;
e.longinfo = `<p>Tells everyone what's shit. Use <code>-p</code> as the first argument to specify the text as plural.</p>`;

e.execute = (msg, words) => {
    var shitText = 'Your favourite anime';
    bu.logger.debug(util.inspect(words));
    var plural = false;
    if (words.length > 1) {
        words.shift();
        if (words[0] == '-p') {
            plural = true;
            words.shift();
        }
        shitText = words.join(' ');
    }
    var timestamp = moment().format().replace(/:/gi, '_');
    //  gm(path.join(__dirname, '..', 'img', 'SHIT.png'))
    ///      .write(path.join(__dirname, '..', 'img', 'generated', 'SHIT.png'), (err) => {
    //          bu.logger.(err)
    //      })
    bot.sendChannelTyping(msg.channel.id);
    gm()
        .command('convert')
        //   .fontSize(40)
        .font(path.join(__dirname, '..', 'img/fonts/animeace2_reg.ttf'))
        .rawSize(200, 160)
        .out('-background')
        .out('transparent')
        // .stroke('#000000')
        //   .strokeWidth(text.length > 40 ? 1 : 2)
        .fill('#000000')
        .gravity('South')
        .out(`caption:${shitText}`)
        .options({
            imageMagick: true
        })
        .write(path.join(__dirname, '..', `img/generated/shitCaption-${timestamp}.png`), function (err) {
            if (err) throw err;
            bu.logger.debug(path.join(__dirname, '..', `img/generated/shitCaption-${timestamp}.png`));
            gm(path.join(__dirname, '..', 'img', `SHIT${plural ? 'S' : ''}.png`))
                .composite(path.join(__dirname, '..', `img/generated/shitCaption-${timestamp}.png`))
                .geometry('+810+31')
                .options({
                    imageMagick: true
                })
                .toBuffer('PNG', (err, buf) => {
                    if (err) throw err;
                    bot.createMessage(msg.channel.id, '', {
                        name: 'SHIT.png',
                        file: buf
                    });
                });

        });
};