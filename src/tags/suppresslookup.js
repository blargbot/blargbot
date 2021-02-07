/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:27:44
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.BotTag('suppresslookup')
        .withArgs(a => [a.optional('value')])
        .withDesc('Sets whether error messages in the lookup system (query canceled, nothing found) should be suppressed. `value` must be a boolean, and defaults to `true`.')
        .withExample(
            '{suppresslookup}',
            ''
        )
        .whenArgs('0-1', async function (subtag, context, args) {
            let suppress = true;
            if (args.length === 1) {
                suppress = bu.parseBoolean(args[0]);
                if (!bu.isBoolean(suppress))
                    return Builder.errors.notABoolean(subtag, context);
            }
            context.scope.suppressLookup = suppress;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();