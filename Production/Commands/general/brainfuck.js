const { GeneralCommand } = require('../../../Core/Structures/Command');
const brainfuck = require('brainfuck-node');

class BrainfuckCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'brainfuck',
            flags: [
                { flag: 'p', name: 'pointers', info: 'Specifies that the resulting pointers should be outputted.' },
                { flag: 'i', name: 'input', info: 'Specifies input parameters.' }
            ],
            aliases: ['bf', 'rainfuck'],
            minArgs: 1
        });
    }

    async execute(ctx) {
        try {
            let output = brainfuck.execute(ctx.input._.join(''), (ctx.input.i || []).join(' '));
            await ctx.send(output.output.length == 0 ? await ctx.decode('generic.nooutput') : await ctx.decode('generic.output', {
                output: `${output.output}${ctx.input.p ? '\n\n[' + output.memory.list.join(', ') + ']\nPointer: ' + output.memory.pointer : ''}`
            }));
        } catch (err) {
            await this.genericError(ctx, err.message);
        }
    }
}

module.exports = BrainfuckCommand;