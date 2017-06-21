const { Array } = require.main.require('./Tag/Classes');

class SpliceTag extends Array {
    constructor(client) {
        super(client, {
            name: 'splice',
            args: [
                {
                    name: 'array'
                }, {
                    name: 'start'
                }, {
                    name: 'deleteCount',
                    optional: true
                }, {
                    name: 'items',
                    optional: true,
                    repeat: true
                }
            ],
            minArgs: 2
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args, true);
        let arr = await this.loadArray(ctx, args[0]);

        let start = this.parseInt(args[1], 'start');
        let deleteCount = arr.length - start;
        if (args[2])
            deleteCount = this.parseInt(args[2], 'deleteCount');
        let insert = args[3] ? args.slice(3) : [];

        let newArr = new this.TagArray(...arr.splice(start, deleteCount, ...insert));
        if (arr.ctx && arr.name) await arr.save();

        return res.setContent(newArr);
    }
}

module.exports = SpliceTag;