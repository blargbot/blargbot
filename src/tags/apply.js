/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:58
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-15 19:23:19
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    { SubTag, BBTag } = require('../structures/bbtag/Tag');

module.exports =
    Builder.ArrayTag('apply')
        .withArgs(a => [a.require('subtag'), a.optional('args', true)])
        .withDesc('Executes `subtag`, using the `args` as parameters. ' +
        'If `args` is an array, it will get deconstructed to it\'s individual elements.'
        ).withExample(
        '{apply;randint;[1,4]}',
        '3'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let definition = TagManager.get(args[0].toLowerCase());
            if (definition == null)
                return Builder.util.error(subtag, context, 'No subtag found');

            let st = new SubTag(subtag);

            let tagArgs = Builder.util.flattenArgArrays(args.slice(1));
            st._protected.children = [new BBTag(args[0])];

            for (let arg of tagArgs) {
                arg = typeof arg === 'object' ? JSON.stringify(arg) : arg.toString();
                let a = new BBTag(arg);
                a._protected.start = 0;
                a._protected.end = arg.length;
                st._protected.children.push(a);
            }

            let result = await definition.execute(st, context);

            return result;
        })
        .build();
