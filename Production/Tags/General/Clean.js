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
        args = args.parsedArgs;

        for (let i = 0; i < args.text.length; i++) {
            args.text[i] = args.text[i]
                .replace(/[^\S\n]+/gm, ' ') // Shrink whitespace into a single space
                .replace(/(\n *)+/gm, '\n'); // Get rid of spaces after newlines and shrink
            if (args.text[i] === '\n') args.text[i] = '';
        }
        return res.setContent(args.text);
    }
}

module.exports = CleanTag;