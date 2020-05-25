/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:38:55
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-19 18:12:29
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('everyone')
        .withArgs(a => [a.optional('enabled')])
        .withDesc(
            'Returns the mention of `@everyone`.\n' +
            'If `enabled` is `false` it will return a non-pinging `@everyone`, defaults to `true`'
        )
        .withExample(
            '{everyone}',
            '@everyone'
        )
        .whenArgs('0-1', async function (subtag, context, args) {
            let enabled = bu.parseBoolean(args[0], true);
            context.state.allowedMentions.everybody = enabled;
            return "@everyone";
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
        
