const { General } = require.main.require('./Tag/Classes');

class CleanTag extends General {
    constructor(client) {
        super(client, {
            name: 'clean',
            args: [
                {
                    name: 'text'
                }
            ],
            minArgs: 1, maxArgs: 1
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);

        for (let i = 0; i < args[0].length; i++) {
            args[0][i] = args[0][i]
                .replace(/[^\S\n]+/gm, ' ') // Shrink whitespace into a single space
                .replace(/(\n *)+/gm, '\n'); // Get rid of spaces after newlines and shrink
            if (args[0][i] === '\n') args[0][i] = '';
        }
        return res.setContent(args[0]);
    }
}

module.exports = CleanTag;