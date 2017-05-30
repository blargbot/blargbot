const { Tag } = require('../../Core/Structures');

class CommentTag extends Tag {
    constructor(client) {
        super(client, {
            name: '//',
            args: [
                {
                    name: 'text',
                    optional: true,
                    repeat: true
                }
            ]
        });
    }

    async execute(ctx) {
        return await super.execute(ctx, false);
    }
}