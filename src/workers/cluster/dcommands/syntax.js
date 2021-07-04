const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

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

function getToken(iteration) {
    iteration = iteration || 0;
    iteration++;
    let type = bu.getRandomInt(0, 7);
    let token;
    let bracket = getElement(brackets);
    if (type == 0 && iteration < 4) {
        while (bracket[0] == '') bracket = getElement(brackets);
        let mTokens = [];
        for (let i = 0; i < bu.getRandomInt(2, 4); i++) {
            mTokens.push(getToken(iteration));
        }
        token = `${bracket[0]}${mTokens.join(getElement(separators))}${bracket[1]}`;
    } else {
        if (bracket[0] == '') token = getElement(keywords);
        else token = getElement(tokens);
        token = `${bracket[0]}${token}${bracket[1]}`;
    }
    return token;
}

function getElement(array) {
    return array[bu.getRandomInt(0, array.length - 1)];
}

class SyntaxCommand extends BaseCommand {
    constructor() {
        super({
            name: 'syntax',
            aliases: ['syntaxify'],
            category: newbutils.commandTypes.GENERAL,
            usage: 'syntax [command name]',
            info: 'Gives you the \'syntax\' for a command :wink:'
        });
    }

    async execute(msg, words) {
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
