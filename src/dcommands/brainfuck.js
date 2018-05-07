const BaseCommand = require('../structures/BaseCommand');

class BrainfuckCommand extends BaseCommand {
    constructor() {
        super({
            name: 'brainfuck',
            category: bu.CommandType.GENERAL,
            usage: 'brainfuck <code>',
            info: 'Executes brainfuck code.',
            flags: [{
                flag: 'p',
                word: 'pointers',
                desc: 'Shows a list of pointers after the execution.'
            },
            {
                flag: 'i',
                word: 'input',
                desc: 'Specifies the input for the , operator.'
            }]
        });
    }

    async execute(msg, words, text) {
        if (words[1] && /^-[-+<>\.,\[\]]/.test(words[1]))
            words[1] = '\\' + words[1];
        let input = bu.parseInput(this.flags, words);
        if (input.undefined.length == 0) {
            bu.send(msg, 'Not enough parameters! Do `b!help brainfuck` for more details.');
            return;
        }
        try {
            let output = dep.brainfuck.execute(input.undefined.join(' '), (input.i || []).join(' '));
            bu.send(msg, output.output.length == 0 ? 'No output...' : `Output:\n${await bu.filterMentions(output.output)}${input.p ? '\n\n[' + output.memory.list.join(', ') + ']\nPointer: ' + output.memory.pointer : ''}`);
        } catch (err) {
            console.error(err);
            bu.send(msg, `Something went wrong!
Error: \`${err.message}\``);
        }
    }
}

module.exports = BrainfuckCommand;
