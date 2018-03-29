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
        .withDesc('This will rollback a variable to the value it had when the tag started running or the most recent {commit}. ' +
            'Useful if you want to undo any changes you made. `variables` defaults to all cached variables')
        .withExample(
            '{set;_var;Hello!} {rollback;_var} {get;_var}',
            'GoodBye!'
        )
        .whenDefault(async function (subtag, context, args) {
            let values = args.length == 0
                ? Object.keys(context.variables.cache)
                : Builder.util.flattenArgArrays(args);
            for (const variable of values)
                context.variables.reset(variable);
        })
        .build();
