var e = module.exports = {}
var bu = require('./../util.js')
var gm = require('gm')
var path = require('path')
var moment = require('moment')
var fs = require('fs')
var util = require('util')
var bot
var Canvas = require('canvas')
var Image = Canvas.Image
var Font = Canvas.Font
console.log(util.inspect(Font))
//var animeace = new Font('Anime Ace 2.0 BB', path.join(__dirname, 'img', 'fonts', 'animeace2_reg.ttf'))

e.init = (Tbot) => {
    bot = Tbot

}

e.requireCtx = require

e.isCommand = true;
e.hidden = false
e.usage = 'shit [-p] <text>';
e.info = `Tells everyone what's shit. Use -p as the first argument to specify it's plural.`;
e.category = bu.CommandType.GENERAL;

e.execute = (msg, words, text) => {
    var shitText = 'Your favourite anime'
    console.log(util.inspect(words))
    var plural = false
    if (words.length > 1) {
        words.shift()
        if (words[0] == '-p') {
            plural = true
            words.shift()
        }
        shitText = words.join(' ')
    }
    var timestamp = moment().format().replace(/:/gi, '_');
    //  gm(path.join(__dirname, '..', 'img', 'SHIT.png'))
    ///      .write(path.join(__dirname, '..', 'img', 'generated', 'SHIT.png'), (err) => {
    //          console.log(err)
    //      })
    bot.sendChannelTyping(msg.channel.id)
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
            console.log(path.join(__dirname, '..', `img/generated/shitCaption-${timestamp}.png`))
            gm(path.join(__dirname, '..', 'img', `SHIT${plural ? 'S' : ''}.png`))
                .composite(path.join(__dirname, '..', `img/generated/shitCaption-${timestamp}.png`))
                .geometry('+810+31')
                .options({
                    imageMagick: true
                })
                //       .resize(1031, 749)                
                /*.write(path.join(__dirname, '..', `img/generated/shit-${timestamp}.png`), (err) => {
                    if (err) throw err;

                    var fuckyou = fs.readFileSync(__dirname, '..', `img/generated/shit-${timestamp}.png`);
                    //  console.log(3, fuckyou)
                    var image = new Buffer(fuckyou);
                    //   console.log(4, image);
                    bot.createMessage(channelid, ``, {
                        name: 'freefreefree.gif',
                        file: image
                    })
                    */

                .toBuffer('PNG', (err, buf) => {
                    if (err) throw err;
                    bot.createMessage(msg.channel.id, '', {
                        name: 'SHIT.png',
                        file: buf
                    })
                })
            //   .write(path.join(__dirname, '..', `img/generated/shit-${timestamp}.png`), (err) => {
            //        console.log(err)
            //  })
            //   })
        });
}
/*
    var canvas = new Canvas(1031, 749)
    var ctx = canvas.getContext('2d')

    var shit = new Image()
    shit.src = fs.readFileSync(path.join(__dirname, '..', 'img', 'SHIT.png'))
    //  var whitecard = new Image()
    //   whitecard.src = fs.readFileSync(path.join(__dirname,  '..', 'img', 'whitecard.png'))

    //   ctx.fillStyle = "white"
    //   ctx.drawImage(blackcard, 0, 0)
    //   wrapText(ctx, blackphrase, 19, 38, 144, 20);
    ctx.fillStyle = "black"
    ctx.drawImage(shit, 0, 0)
    wrapText(ctx, shitText, 810, 31, 200, 160)

    var data = canvas.toBuffer()
    bu.sendMessageToDiscord(msg.channel.id, ``, {
        name: 'SHIT.png',
        file: data
    })


}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    var size = 72
    context.font = `${size}px Anime Ace 2.0 BB`
    while (context.measureText(text) > maxWidth) {
        size--;
        context.font = `${size}px Anime Ace 2.0 BB`
    }
    //  if (text.length > 110) {
    //     context.font = '16px Arial';
    //  } else {
    //    context.font = '20px Arial';

    // }
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
*/
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