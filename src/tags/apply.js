/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:58
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-08-13 00:52:53
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    { SubTag, BBTag } = require('../structures/bbtag/Tag');

module.exports =
    Builder.ArrayTag('apply')
        .withArgs(a => [a.require([a.optional('subtag'), a.optional('function')]), a.optional('args', true)])
        .withDesc('Executes `subtag` or `function`, using the `args` as parameters. ' +
            'If `args` is an array, it will get deconstructed to it\'s individual elements.\n' +
            '`function` must be of the format `func.<name>` eg: `{apply;func.hello;["world"]}`'
        ).withExample(
        '{apply;randint;[1,4]}',
        '3'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let runSubtag;
            const name = args[0].toLowerCase();
            if (context.state.overrides.hasOwnProperty(name)) {
                runSubtag = context.state.overrides[name];
            } else {
                const tagDefinition = TagManager.get(name) || {};
                runSubtag = context.state.overrides[tagDefinition.name] || tagDefinition.execute;
            }
            if (runSubtag === undefined)
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

            let result = await runSubtag(st, context);

            return result;
        })
        .build();
