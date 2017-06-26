const { General } = require.main.require('./Tag/Classes');

class TrimTag extends General {
    constructor(client) {
        super(client, {
            name: 'trim',
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
            // If whitespace
            if (typeof args[0][i] === 'string' && !args[0][i].trim())
                args[0][i] = '';
            else if (typeof args[0][i] === 'string') {
                args[0][i] = args[0][i].replace(/^\s+/, '');
                break;
            } else break;
        }
        for (let i = args[0].length; i > -1; i--) {
            // If whitespace
            if (typeof args[0][i] === 'string' && !args[0][i].trim())
                args[0][i] = '';
            else if (typeof args[0][i] === 'string') {
                args[0][i] = args[0][i].replace(/\s+$/, '');
                break;
            } else break;
        }
        return res.setContent(args[0]);
    }
}

module.exports = TrimTag;