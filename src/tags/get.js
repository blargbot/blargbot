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
    Builder.AutoTag('get')
        .withArgs(a => [a.required('varName'), a.optional('index')])
        .withDesc('Returns the stored variable `varName`, or an index within it if it is a stored array. ' +
            'You can use a character prefix to determine the scope of your variable.\n' +
            'Valid scopes are: ' + bu.tagVariableScopes.map(s => '`' + (s.prefix || 'none') + '` (' + s.name + ')').join(', ') +
            '. For more information, use `b!t docs variable` or `b!cc docs variable`'
        ).withExample(
            '{set;var1;This is local var1}\n{set;~var2;This is temporary var2}\n{set;var3;this;is;an;array}\n' +
            '{get;var1}\n{get;~var2}\n{get;var3}',
            'This is local var1\nThis is temporary var2\n{"v":["this","is","an","array"],"n":"var3"}'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            let result = await context.variables.get(args[0]),
                index = bu.parseInt(args[1]);

            if (!Array.isArray(result))
                return result;

            if (!args[1])
                return bu.serializeTagArray(result, args[0]);

            if (isNaN(index))
                return Builder.errors.notANumber(subtag, context);

            if (result[index] === undefined)
                return Builder.util.error(subtag, context, 'Index out of range');

            return result[index];
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();