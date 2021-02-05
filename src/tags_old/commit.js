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
        .withDesc('For optimization reasons, variables are not stored in the database immediately when you use `{set}`. ' +
            'Instead they are cached, and will be saved to the database when the tag finishes. If you have some `variables` that ' +
            'you need to be saved to the database immediately, use this to force an update right now.\nThis comes at a slight ' +
            'performance cost, so use only when needed.\n`variables` defaults to all values accessed up to this point.\n' +
            '`{rollback}` is the counterpart to this.')
        .withExample(
            '{set;var;Hello!}\n{commit}\n{set;var;GoodBye!}\n{rollback}\n{get;var}',
            'Hello!'
        )
        .whenDefault(async function (subtag, context, args) {
            let values = args.length == 0
                ? Object.keys(context.variables.cache)
                : Builder.util.flattenArgArrays(args);
            await context.variables.persist(values);
        })
        .build();