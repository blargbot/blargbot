var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'tokenify <input>';
e.info = 'Converts the given input into a token.';
e.category = bu.CommandType.GENERAL;
e.longinfo = '<p>Converts the given input into a token.</p>';

e.execute = (msg, words, text) => {
    console.log(words.length);
    if (words.length > 1) {
        var pasta = words.splice(1, words.length).join(' ').replace(/[^0-9a-z]/gi, '').toLowerCase();
        console.log(pasta);
        var newPasta = [];
        for (var i = 0; i < pasta.length; i++) {
            console.log(pasta[i]);
            var seed = bu.getRandomInt(1, 4);
            if (seed >= 3) {
                newPasta.push(pasta[i].toUpperCase());
            } else {
                newPasta.push(pasta[i]);
            }
            if (i != pasta.length - 1)
                if (bu.getRandomInt(1, 20) == 15) {
                    newPasta.push('.');
                } else if (bu.getRandomInt(1, 30) == 15) {
                    newPasta.push('-');
                } else if (bu.getRandomInt(1, 30) == 15) {
                    newPasta.push('\\_');
                }
        }
        console.log(newPasta.join(''));
        bu.send(msg.channel.id, newPasta.join(''));
    } else {
        bu.send(msg.channel.id, 'Not enough arguments given');
    }
};