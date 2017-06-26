const { Message } = require.main.require('./Tag/Classes');

class MessageIdTag extends Message {
    constructor(client) {
        super(client, {
            name: 'id',
            args: [],
            minArgs: 0, maxArgs: 0
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        return res.setContent(ctx.msg.id);
    }
}

module.exports = MessageIdTag;