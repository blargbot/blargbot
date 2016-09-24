var e = module.exports = {};
var path = require('path');
var fs = require('fs');
var bot;
var cah = {};
var Canvas = require('canvas');
var Image = Canvas.Image;
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;
    if (fs.existsSync(path.join(__dirname, '..', 'cah.json'))) {
        cah = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'cah.json'), 'utf8'));
    }

    e.category = bu.CommandType.GENERAL;
};

e.isCommand = true;

e.requireCtx = require;

e.hidden = false;
e.usage = 'cah';
e.info = 'Generates a set of CAH cards.';
e.longinfo = '<p>Generates a random set of Cards Against Humanity cards.</p>';

e.execute = (msg) => {
    new Promise((fulfill) => {
        bu.guildSettings.get(msg.channel.guild.id, 'cahnsfw').then(val => {
            if (val && val != 0) {
                bu.isNsfwChannel(msg.channel.id).then(cont => {
                    fulfill(cont);
                });
            } else {
                fulfill(true);
            }
        });
    }).then(cont => {
        if (cont)
            doit(msg);
        else
            bu.sendMessageToDiscord(msg.channel.id, bu.config.general.nsfwMessage);
    });
};

function doit(msg) {
    //   console.log(util.inspect(cah))
    var blackphrase = cah.black[bu.getRandomInt(0, cah.black.length)];
    //   console.log(blackphrase)
    var blankCount = /.\_\_[^\_]/g.test(blackphrase) ? blackphrase.match(/.\_\_[^\_]/g).length : 1;
    //   console.log(blankCount)
    var canvas = new Canvas(185 * (1 + blankCount), 254);
    var ctx = canvas.getContext('2d');

    var blackcard = new Image();
    blackcard.src = fs.readFileSync(path.join(__dirname, '..', 'img', 'blackcard.png'));
    var whitecard = new Image();
    whitecard.src = fs.readFileSync(path.join(__dirname, '..', 'img', 'whitecard.png'));

    ctx.fillStyle = 'white';
    ctx.drawImage(blackcard, 0, 0);
    wrapText(ctx, blackphrase, 19, 38, 144, 20);
    ctx.fillStyle = 'black';
    var usedCards = [];
    for (var i = 0; i < blankCount; i++) {
        ctx.drawImage(whitecard, ((i + 1) * (184 + 1)), 0);

        var whitephrase = cah.white[bu.getRandomInt(0, cah.black.length)];
        while (usedCards.indexOf(whitephrase) > -1) {
            whitephrase = cah.white[bu.getRandomInt(0, cah.black.length)];
        }
        usedCards.push(whitephrase);
        wrapText(ctx, whitephrase, 19 + ((i + 1) * (184 + 1)), 38, 144, 20);
    }

    var data = canvas.toBuffer();
    bu.sendMessageToDiscord(msg.channel.id, ``, {
        name: 'cards.png',
        file: data
    }).catch(err => {
        console.log(err);
    });

}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    if (text.length > 110) {
        context.font = '16px Arial';
    } else {
        context.font = '20px Arial';

    }
    var words = text.split(' ');
    var line = '';

    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

/*
function generateCards(msg, timestamp, blackphrase, blankCount, iteration, usedCards) {
    console.log(iteration)
    if (iteration > blankCount) {
        //finished
        var image = gm(path.join(__dirname, '..', `img/generated/cah/card-0-${timestamp}.png`))
        for (var i = 1; i < blankCount + 1; i++) {
            console.log('appending')
            image.append(path.join(__dirname, '..', `img/generated/cah/card-${i}-${timestamp}.png`), true)
        }
        image.write(path.join(__dirname, '..', `img/generated/cah/cards-${timestamp}.png`), function (err) {
            if (err) throw err
            //  callback()
            fs.readFile(path.join(__dirname, '..', `img/generated/cah/cards-${timestamp}.png`), (err, data) => {
                bu.sendMessageToDiscord(msg.channel.id, ``, {
                    name: 'cards.png',
                    file: data
                })
            })
        });

    } else if (iteration == 0) {
        generateCard(timestamp, blackphrase, iteration, true, () => {
            iteration++;
            generateCards(msg, timestamp, blackphrase, blankCount, iteration, usedCards)
        })
    } else {
        //   console.log(util.inspect(usedCards))
        var text = cah.white[bu.getRandomInt(0, cah.white.length)]
        //   console.log(text, usedCards.indexOf(text))
        while (usedCards.indexOf(text) > -1) {
            //    console.log(text)
            text = cah.white[bu.getRandomInt(0, cah.white.length)]
        }
        //   console.log(text)
        usedCards.push(text)

        generateCard(timestamp, text, iteration, false, () => {
            iteration++;

            generateCards(msg, timestamp, blackphrase, blankCount, iteration, usedCards)
        })
    }
}


function generateCard(timestamp, text, thing, black, callback) {
    gm()
        .command('convert')
        //   .fontSize(40)
        .font(path.join(__dirname, '..', 'img/fonts/arialdb.ttf'))
        .rawSize(144, 187)
        .out('-background')
        .out('transparent')
        //   .stroke('#000000')
        //    .strokeWidth(text.length > 50 ? 1 : 2)
        .fill(black ? '#ffffff' : '#000000')
        .gravity('Left')
        .out(`caption:${text}`)
        .options({
            imageMagick: true
        })
        .write(path.join(__dirname, '..', `img/generated/cah/caption-${thing}-${timestamp}.png`), function (err) {
            if (err) throw err;
            gm(path.join(__dirname, '..', `img/${black ? 'black' : 'white'}card.png`))
                .composite(path.join(__dirname, '..', `img/generated/cah/caption-${thing}-${timestamp}.png`))
                .geometry('+19+21')
                .write(path.join(__dirname, '..', `img/generated/cah/card-${thing}-${timestamp}.png`), function (err) {
                    if (err) throw err
                    callback()
                });
        });
}
*/