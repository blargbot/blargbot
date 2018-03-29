/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:45
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:45
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('commit')
        .withArgs(a => a.optional('variables', true))
        .withDesc('This will force the given `variables` to be stored in the database. `variables` defaults to all cached values.\n' +
            'This operation can be quite slow, so ensure that you use it sparingly for maximum performance!')
        .withExample(
            '{set;_var;Hello} {commit}',
            '(Idk how to show this, _var will be in the database rather than in the cache'
        )
        .whenDefault(async function (subtag, context, args) {
            let values = args.length == 0
                ? Object.keys(context.variables.cache)
                : Builder.util.flattenArgArrays(args);
            await context.variables.persist(values);
        })
        .build();