/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:35
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:51:35
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('rollback')
        .withArgs(a => a.optional('variables', true))
        .withDesc('For optimization reasons, variables are not stored in the database immediately when you use `{set}`. ' +
            'Instead they are cached, and will be saved to the database when the tag finishes. If you have some `variables` ' +
            'that you dont want to be changed, you can use this to revert them back to their value at the start of the tag, or ' +
            'the most recent `{commit}`.\n`variables` defaults to all values accessed up to this point.\n' +
            '`{commit}` is the counterpart to this.')
        .withExample(
            '{set;var;Hello!}\n{commit}\n{set;var;GoodBye!}\n{rollback}\n{get;var}',
            'Hello!'
        )
        .whenDefault(async function (subtag, context, args) {
            let values = args.length == 0
                ? Object.keys(context.variables.cache)
                : Builder.util.flattenArgArrays(args);
            for (const variable of values)
                context.variables.reset(variable);
        })
        .build();
