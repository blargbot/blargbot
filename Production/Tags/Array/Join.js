const { Array } = require.main.require('./Tag/Classes');

class JoinTag extends Array {
    constructor(client) {
        super(client, {
            name: 'join',
            args: [
                {
                    name: 'array'
                }, {
                    name: 'delimiter'
                }
            ],
            minArgs: 2, maxArgs: 2
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args, true);
        args = args.parsedArgs;
        let arr = await this.loadArray(ctx, args.array);
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] instanceof this.TagArray) arr[i] = arr[i].toString();
            else if (global.Array.isArray(arr[i])) arr[i] = arr[i].join('');
        }
        console.log(arr);


        return res.setContent(arr.join(args[1].join('')));
    }
}

module.exports = JoinTag;