const { Array } = require.main.require('./Tag/Classes');

class SliceTag extends Array {
    constructor(client) {
        super(client, {
            name: 'slice',
            args: [
                {
                    name: 'array'
                }, {
                    name: 'start'
                }, {
                    name: 'end',
                    optional: true
                }
            ],
            minArgs: 2
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args, true);
        args = args.parsedArgs;
        let arr = await this.loadArray(ctx, args.array);

        let start = this.parseInt(args.start, 'start');
        let end;
        if (args[2])
            end = this.parseInt(args.end, 'end');

        let newArr = new this.TagArray(...arr.slice(start, end));
        return res.setContent(newArr);
    }
}

module.exports = SliceTag;