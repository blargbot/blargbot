const { Array } = require.main.require('./Tag/Classes');
const ewsyncSort = require('async-merge-sort');

class SortTag extends Array {
    constructor(client) {
        super(client, {
            name: 'sort',
            args: [
                {
                    name: 'array'
                }, {
                    name: 'varNameOne',
                    optional: true
                }, {
                    name: 'varNameTwo',
                    optional: true
                }, {
                    name: 'function',
                    optional: true
                }
            ],
            minArgs: 1, maxArgs: 4
        });
    }

    get numberRegex() {
        return /^-?\d+(\.\d+)?$/;
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args, false);
        if (args.length === 4)
            for (let i = 0; i < args.length && i < 3; i++)
                args[i] = await ctx.processSub(args[i]);
        else args[0] = await ctx.processSub(args[0]);

        let arr = await this.loadArray(ctx, args[0]);


        arr = arr.map(a => {
            // Normalize sub-elements
            if (a.length > 1) a = a.join('');
            // Retrieve the singular value instead
            else a = a[0];

            // Parse numbers
            if (this.numberRegex.test(a)) a = parseFloat(a);
            return a;
        });

        if (args.length === 1) arr = arr.sort((a, b) => a - b);
        else if (args.length === 2) {
            arr = await this.sort(ctx, arr, 'a', 'b', args[1]);
        } else if (args.length === 4) {
            arr = await this.sort(ctx, arr, args[1], args[2], args[3]);
        } else this.throw(ctx.client.Constants.TagError.TOO_FEW_ARGS, {
            expected: 4,
            received: args.length
        });
        if (arr.ctx && arr.name) await arr.save();

        return res.setContent(arr);
    }

    sort(ctx, items, varNameOne, varNameTwo, code) {
        return new Promise((res, rej) => {
            ewsyncSort(items, (a, b, callback) => {
                ctx.client.TagVariableManager.executeSet(ctx, varNameOne, a)
                    .then(() => ctx.client.TagVariableManager.executeSet(ctx, varNameTwo, b))
                    .then(() => ctx.processSub(code))
                    .then(content => {
                        console.log(a, b, content);
                        let res = parseInt(content.join(''));
                        if (isNaN(res)) res = 0;
                        else if (res > 0) res = 1;
                        else if (res < 0) res = -1;
                        callback(null, res);
                    });
            }, (err, sorted) => {
                if (err) rej(err);
                else res(sorted);
            });
        });
    }


}

module.exports = SortTag;