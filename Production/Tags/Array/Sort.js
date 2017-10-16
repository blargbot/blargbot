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
        args = args.parsedArgs;
        args.array = await ctx.processSub(args.array);
        if (args.varNameOne)
            args.varNameOne = await ctx.processSub(args.varNameOne);
        if (args.varNameTwo)
            args.varNameTwo = await ctx.processSub(args.varNameTwo);

        let arr = await this.loadArray(ctx, args.array);

        arr = arr.map(a => {
            // Normalize sub-elements
            if (a.length > 1) a = a.join('');
            // Retrieve the singular value instead
            else a = a[0];

            // Parse numbers
            if (this.numberRegex.test(a)) a = parseFloat(a);
            return a;
        });

        let newArr;

        if (!args.function) newArr = arr.sort((a, b) => a - b);
        else {
            newArr = await this.sort(ctx, arr, args.varNameOne || 'a', args.varNameTwo || 'b', args.function);
        }
        arr.splice(0, arr.length, ...newArr);

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