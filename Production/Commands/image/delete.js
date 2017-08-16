const { ImageCommand } = require('../../../Core/Structures/Command');
const superagent = require('superagent');

class DeleteCommand extends ImageCommand {
    constructor(client) {
        super(client, {
            name: 'delete',
            minArgs: 1
        });
    }

    async execute(ctx) {
        await this.client.Helpers.Image.generate(ctx.channel, 'delete', {
            text: ctx.input._.raw.join('')
        });
    }
}

module.exports = DeleteCommand;