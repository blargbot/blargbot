/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:58
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-16 11:52:11
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('apply')
        .withArgs(a => [a.require('subtag'), a.optional('args', true)])
        .withDesc('Executes `subtag`, using the `args` as parameters. ' +
            'If `args` is an array, it will get deconstructed to it\'s individual elements.'
        ).withExample(
            '{apply;randint;[1,4]}',
            '3'
        )
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            if (!TagManager.list.hasOwnProperty(args[0]))
                return Builder.util.error(subtag, context, 'No subtag found');
            let tag = TagManager.list[args[0]];
            let tagArgs = Builder.util.flattenArgArrays(args.slice(1));

            args = [args[0], ...tagArgs];

            args = args.map(v => {
                if (typeof v === 'string')
                    return v;
                try {
                    return JSON.stringify(v);
                } catch (e) {
                    return '';
                }
            });

            return await tag.execute(subtag, context, args);
        })
        .build();