var e = module.exports = {};


var cah = {};
var cad = {};


e.init = () => {
    if (dep.fs.existsSync(dep.path.join(__dirname, '..', 'cah.json'))) {
        cah = JSON.parse(dep.fs.readFileSync(dep.path.join(__dirname, '..', 'cah.json'), 'utf8'));
    }

    dep.request('https://api.cardcastgame.com/v1/decks/JJDFG/cards', (err, res, body) => {
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

    e.category = bu.CommandType.IMAGE;
};

e.isCommand = true;
e.requireCtx = require;
e.hidden = false;
e.usage = 'cah';
e.info = 'Generates a set of CAH cards.';
e.longinfo = '<p>Generates a random set of Cards Against Humanity cards.</p>';

e.execute = async function(msg, words) {
    let val = await bu.guildSettings.get(msg.channel.guild.id, 'cahnsfw');
    let cont = true;
    if (val && val != 0) {
        cont = await bu.isNsfwChannel(msg.channel.id);
    }

    if (cont) {
        doit(msg, words);
    } else
        bu.send(msg, config.general.nsfwMessage);
};

async function doit(msg, words) {
    let doCad = words[1] && words[1].toLowerCase() == 'cad';
    let cardObj = doCad ? cad : cah;

    var blackPhrase = cardObj.black[bu.getRandomInt(0, cardObj.black.length)];
    var blankCount = /.\_([^\_]|$)/g.test(blackPhrase) ? blackPhrase.match(/.\_([^\_]|$)/g).length : 1;

    let whitePhrases = [];
    for (var i = 0; i < blankCount; i++) {
        var whitePhrase = cardObj.white[bu.getRandomInt(0, cardObj.black.length)];
        while (whitePhrases.indexOf(whitePhrase) > -1) {
            whitePhrase = cardObj.white[bu.getRandomInt(0, cardObj.black.length)];
        }
        whitePhrases.push(whitePhrase);
    }
    bot.sendChannelTyping(msg.channel.id);

    let code = bu.genEventCode();
    let buffer = await bu.awaitEvent({
        cmd: 'img',
        command: 'cah',
        black: blackPhrase,
        white: whitePhrases
    });
    bu.send(msg, undefined, {
        file: buffer,
        name: 'cah.png'
    });

}