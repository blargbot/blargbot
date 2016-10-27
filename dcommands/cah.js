var e = module.exports = {};
var path = require('path');
var fs = require('fs');

var cah = {};
var cad = {};
var Canvas = require('canvas');
var Image = Canvas.Image;
var request = require('request');



e.init = () => {
    
    
    if (fs.existsSync(path.join(__dirname, '..', 'cah.json'))) {
        cah = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'cah.json'), 'utf8'));
    }

    request('https://api.cardcastgame.com/v1/decks/JJDFG/cards', (err, res, body) => {
        try {
        let tempCad = JSON.parse(body);
        cad.black = tempCad.calls.map(m => {
            return m.text.join('______');
        });
        cad.white = tempCad.responses.map(m => {
            return m.text.join('______');
        });
        } catch (err) {
            console.log(err.stack);
        }
    });

    e.category = bu.CommandType.GENERAL;
};

e.isCommand = true;

e.requireCtx = require;

e.hidden = false;
e.usage = 'cah';
e.info = 'Generates a set of CAH cards.';
e.longinfo = '<p>Generates a random set of Cards Against Humanity cards.</p>';
e.execute = (msg, words) => {
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
            doit(msg, words);
        else
            bu.sendMessageToDiscord(msg.channel.id, bu.config.general.nsfwMessage);
    });
};

function doit(msg, words) {
    let doCad = words[1] && words[1].toLowerCase() == 'cad';
    let cardObj = doCad ? cad : cah;

    var blackphrase = cardObj.black[bu.getRandomInt(0, cardObj.black.length)];
    var blankCount = /.\_([^\_]|$)/g.test(blackphrase) ? blackphrase.match(/.\_([^\_]|$)/g).length : 1;
    var canvas = new Canvas(185 * (1 + blankCount), 254);
    var ctx = canvas.getContext('2d');
    logger.debug(blackphrase);
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

        var whitephrase = cardObj.white[bu.getRandomInt(0, cardObj.black.length)];
        while (usedCards.indexOf(whitephrase) > -1) {
            whitephrase = cardObj.white[bu.getRandomInt(0, cardObj.black.length)];
        }
        logger.debug(blackphrase);
        usedCards.push(whitephrase);
        wrapText(ctx, whitephrase, 19 + ((i + 1) * (184 + 1)), 38, 144, 20);
    }

    var data = canvas.toBuffer();
    bu.sendMessageToDiscord(msg.channel.id, ``, {
        name: 'cards.png',
        file: data
    }).catch(err => {
        logger.error(err);
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