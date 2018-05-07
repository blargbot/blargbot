const BaseCommand = require('../structures/BaseCommand');

const tokens = [
    'text', 'string', 'number', 'true/false', 'emote', 'fruit',
    'tag', 'name', 'duration', 'question', 'member', 'user', 'name',
    'command', 'integer', 'decimal', 'date', 'content', 'title', 'animal'
];
const keywords = ['edit', 'update', 'add', 'create', 'destroy', 'touch', 'fix', 'choose'];
const brackets = [
    ['<', '>'],
    ['[', ']'],
    ['', '']
];
const separators = [
    ' | ',
    ' '
];

class SyntaxCommand extends BaseCommand {
    constructor() {
        super({
            name: 'syntax',
            category: bu.CommandType.GENERAL,
            usage: 'syntax [command name]',
            info: 'Gives you the \'syntax\' for a command :wink:'
        });
    }

    async execute(msg, words, text) {
        let command = 'syntax';
        if (words[1]) {
            command = words.slice(1).join(' ').replace(/\n/g, ' ').replace(/\s+/g, ' ');
        }
        let output = `Invalid usage!\nProper usage: \`${command} `;
        let mTokens = [];
        for (let i = 0; i < bu.getRandomInt(1, 10); i++) {
            mTokens.push(getToken());
        }
        output += mTokens.join(' ') + '`';
        bu.send(msg, output);
    }
}

module.exports = SyntaxCommand;
