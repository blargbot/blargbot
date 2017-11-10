const { ImageCommand } = require('../../../Core/Structures/Command');
const superagent = require('superagent');

class WritePoemCommand extends ImageCommand {
    constructor(client) {
        super(client, {
            name: 'writepoem',
            info: 'Writes a lovely lovely poem.',
            usage: '[text]',
            aliases: ['poem'],
            flags: [
                { flag: 'm', name: 'monika', info: 'Just Monika.' },
                { flag: 's', name: 'sayori', info: 'Just Monika.' },
                { flag: 'y', name: 'yuri', info: 'Just Monika.' },
                { flag: 'n', name: 'natsuki', info: 'Just Monika.' }
            ]
        });
    }

    async execute(ctx) {
        let name = 'monika';
        if (ctx.input.m)
            name = 'monika';
        else if (ctx.input.s)
            name = 'sayori';
        else if (ctx.input.y)
            name = 'yuri';
        else if (ctx.input.n)
            name = 'natsuki';

        let text = ctx.input._.raw.join('');

        if (ctx.input._.length === 0) {
            for (const key in ctx.input) {
                if (ctx.input[key].length > 0) {
                    text = ctx.input[key].raw.join('');
                    break;
                }
            }
        }

        await this.client.Helpers.Image.generate(ctx.channel, 'poem', {
            text,
            name
        });
    }
}

module.exports = WritePoemCommand;