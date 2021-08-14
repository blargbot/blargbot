const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class TokenifyCommand extends BaseCommand {
    constructor() {
        super({
            name: 'tokenify',
            category: newbutils.commandTypes.GENERAL,
            usage: 'tokenify <input>',
            info: 'Converts the given input into a token.'
        });
    }

    async execute(msg, words) {
        console.debug(words.length);
        if (words.length > 1) {
            let pasta = words.splice(1, words.length).join(' ').replace(/[^0-9a-z]/gi, '').toLowerCase();
            console.debug(pasta);
            let newPasta = [];
            for (let i = 0; i < pasta.length; i++) {
                console.debug(pasta[i]);
                let seed = bu.getRandomInt(1, 4);
                if (seed >= 3) {
                    newPasta.push(pasta[i].toUpperCase());
                } else {
                    newPasta.push(pasta[i]);
                }
                if (i != pasta.length - 1) {
                    const randInts = [bu.getRandomInt(1, 20), bu.getRandomInt(1, 30), bu.getRandomInt(1, 30)];
                    if (randInts[0] == 15) {
                        newPasta.push('.');
                    } else if (randInts[1] == 15) {
                        newPasta.push('-');
                    } else if (randInts[2] == 15) {
                        newPasta.push('\\_');
                    }
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
