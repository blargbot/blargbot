const { CatCommand } = require('../../../Core/Structures/Command');
const util = require('util');

class EvalCommand extends CatCommand {
    constructor(client) {
        super(client, {
            name: 'eval'
        });
    }

    async execute(ctx) {
        let input = ctx.text.split(' ').slice(1).join(' ');
        try {
            let response = await this.client.doEval(ctx, input);
            await ctx.send(`Input:\n\`\`\`js\n${input}\n\`\`\`\nOutput:\n\`\`\`\n${util.inspect(response, { depth: 3 })}\n\`\`\``);
        } catch (err) {
            await ctx.send(`Input:\n\`\`\`js\n${input}\n\`\`\`\Error:\n\`\`\`\n${err.message}\n${err.stack}\n\`\`\``);
        }

    }
}

module.exports = EvalCommand;