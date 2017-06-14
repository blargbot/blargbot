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
        let output = args[0]
            .replace(/[^\S\n]+/gm, ' ') // Shrink whitespace into a single space
            .replace(/\n +/gm, '\n'); // Get rid of spaces after newlines
        return res.setContent(output);
    }
}

module.exports = CleanTag;