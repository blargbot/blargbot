const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

const MAX_DICE_AMOUNT = 100;
const MAX_DICE_ROLL = 2000;
const CAT_ROLLS = [
    'http://gifrific.com/wp-content/uploads/2013/06/Cat-Rolls-In-A-Ball.gif',
    'https://media.giphy.com/media/4LTGEdPBPjA10eKu1Dby/giphy.gif',
    'https://media.giphy.com/media/yOQFhJjH31dUQ/giphy.gif'
];
const RICK_ROLLS = [
    'https://media.giphy.com/media/5kq0GCjHA8Rwc/giphy.gif',
    'https://giphy.com/gifs/rick-astley-Ju7l5y9osyymQ',
    'https://tenor.com/Eszv.gif'
];

class RollCommand extends BaseCommand {
    constructor() {
        super({
            name: 'roll',
            category: newbutils.commandTypes.GENERAL,
            usage: 'roll [dice] [modifier]',
            info: 'Rolls an amount of dice (ex. 1d20) and adds the modifier.'
        });
    }

    async execute(msg, words, text) {
        let message = `**${msg.author.username}**, rolling `;
        let max = 20;
        let dice = 1;
        let rollList = [];

        if (words.length > 1) {
            if (words[1].indexOf('cat') > -1) {
                const catUrl = CAT_ROLLS[bu.getRandomInt(0, CAT_ROLLS.length - 1)];
                bu.send(msg, catUrl);
                return;
            }
            if (words[1].indexOf('rick') > -1) {
                const rickUrl = RICK_ROLLS[bu.getRandomInt(0, RICK_ROLLS.length - 1)];
                bu.send(msg, rickUrl);
                return;
            }
            if (words[1] == 'character') {
                let message = 'Rolling a character:\n```xl\n';
                for (let ii = 0; ii < 6; ii++) {
                    const rolls = [];
                    for (let i = 0; i < 4; i++) {
                        rolls.push(bu.getRandomInt(1, 6));
                    }

                    const rollText = rolls.join(', ');

                    rolls.sort();
                    const total = rolls.reduce((acu, cur) => acu + cur);
                    const newtotal = total - rolls[0];
                    message += `Stat #${ii + 1} - [ ${rollText} ] > ${total < 10 && total > -10 ? ` ${total}` : total} - ${rolls[0]} > ${newtotal < 10 && newtotal > -10 ? ` ${newtotal}` : newtotal}\n`;
                }
                bu.send(msg, `${message}\n\`\`\``);
                return;
            }
            if (words[1].indexOf('d') > -1) {
                const roll = words[1].split('d');
                max = parseInt(roll[1]);
                dice = parseInt(roll[0]);
            } else {
                max = parseInt(words[1]);
            }
        }
        if (dice > MAX_DICE_AMOUNT) {
            message = `Too many dice! You're limited to ${MAX_DICE_AMOUNT}.\n` + message;
        }
        if (max > MAX_DICE_ROLL) {
            message = `Too many sides! You're limited to ${MAX_DICE_ROLL}-sided dice.\n` + message;
        }

        dice = Math.max(Math.min(dice, MAX_DICE_AMOUNT), 1);
        max = Math.max(Math.min(max, MAX_DICE_ROLL), 1);

        message += `${dice}d${max}`;
        for (let i = 0; i < dice; i++) {
            rollList.push(bu.getRandomInt(1, max));
        }

        const total = rollList.reduce((acu, cur) => acu + cur);
        message += ` - [ ${rollList.join(', ')} ] > ${total}`;

        if (words.length > 2) {
            const additive = parseInt(words[2]);
            const newTotal = total + additive;
            message += ` + ${additive} > ${newTotal}`;
        }

        if (rollList.length == 1 && max == 20 && rollList[0] == 20) {
            message += `\`\`\`diff
+ NATURAL 20
\`\`\``;
        } else if (rollList.length == 1 && max > 1 && rollList[0] == 1) {
            message += `\`\`\`diff
- Natural 1...
\`\`\``;
        }
        bu.send(msg, message);
    }
}

module.exports = RollCommand;
