const { Logic } = require.main.require('./Tag/Classes');

class IfTag extends Logic {
    constructor(client) {
        super(client, {
            name: 'if',
            args: [
                {
                    name: 'value'
                }, {
                    name: 'then'
                }, {
                    name: 'else',
                    optional: true
                }
            ],
            minArgs: 2
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args, false);

        let val = (await ctx.processSub(args[0])).join('');
        let content = [];
        if (val.toLowerCase() === 'true' || val === '1' || val == true) {
            content = await ctx.processSub(args[1]);
        } else if (val.toLowerCase() === 'false' || val === '0' || val == false) {
            if (args[2])
                content = await ctx.processSub(args[2]);
        } else {
            throw new this.TagError('error.tag.notbool', {
                name: 'value',
                value: val
            });
        }

        return res.setContent(content);
    }

}

module.exports = IfTag;