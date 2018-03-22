/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:14
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 11:30:13
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('set')
        .acceptsArrays()
        .withArgs(a => [a.require('name'), a.optional('value', true)])
        .withDesc('Stores `value` under `name`. These variables are saved between sessions. ' +
            'You can use a character prefix to determine the scope of your variable.\n' +
            'Valid scopes are: ' + bu.tagVariableScopes.map(s => '`' + (s.prefix || 'none') + '` (' + s.name + ')').join(', ') +
            '. For more information, use `b!t docs variable` or `b!cc docs variable`'
        ).withExample(
            '{set;var1;This is local var1}\n{set;~var2;This is temporary var2}\n{set;var3;this;is;an;array}\n' +
            '{get;var1}\n{get;~var2}\n{get;var3}',
            'This is local var1\nThis is temporary var2\n{"v":["this","is","an","array"],"n":"var3"}'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            await context.variables.set(args[0], '');
        })
        .whenArgs(2, async function (subtag, context, args) {
            let deserialized = bu.deserializeTagArray(args[1]);
            if (deserialized != null && Array.isArray(deserialized.v))
                await context.variables.set(args[0], deserialized.v.map(v => typeof v == 'string' ? v : JSON.stringify(v)));
            else
                await context.variables.set(args[0], args[1]);
        })
        .whenDefault(async function (subtag, context, args) {
            context.variables.set(args[0], args.slice(1));
        })
        .build();