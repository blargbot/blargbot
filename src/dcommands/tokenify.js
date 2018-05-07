const BaseCommand = require('../structures/BaseCommand');

class TokenifyCommand extends BaseCommand {
    constructor() {
        super({
            name: 'tokenify',
            category: bu.CommandType.GENERAL,
            usage: 'tokenify <input>',
            info: 'Converts the given input into a token.'
        });
    }

    async execute(msg, words, text) {
        console.debug(words.length);
        if (words.length > 1) {
            var pasta = words.splice(1, words.length).join(' ').replace(/[^0-9a-z]/gi, '').toLowerCase();
            console.debug(pasta);
            var newPasta = [];
            for (var i = 0; i < pasta.length; i++) {
                console.debug(pasta[i]);
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
            console.debug(newPasta.join(''));
            bu.send(msg, newPasta.join(''));
        } else {
            bu.send(msg, 'Not enough arguments given');
        }
    }
}

module.exports = TokenifyCommand;
