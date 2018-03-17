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
        .withArgs(a => [a.require('varName'), a.optional('index')])
        .withDesc('Returns the stored variable `varName`, or an index within it if it is a stored array. ' +
            'You can use a character prefix to determine the scope of your variable.\n' +
            'Valid scopes are: ' + bu.tagVariableScopes.map(s => '`' + (s.prefix || 'none') + '` (' + s.name + ')').join(', ') +
            '. For more information, use `b!t docs variable` or `b!cc docs variable`'
        ).withExample(
            '{set;var1;This is local var1}\n{set;~var2;This is temporary var2}\n{set;var3;this;is;an;array}\n' +
            '{get;var1}\n{get;~var2}\n{get;var3}',
            'This is local var1\nThis is temporary var2\n{"v":["this","is","an","array"],"n":"var3"}'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (params) {
            let result = await this.getVar(params, params.args[1]),
                index = bu.parseInt(params.args[2]);

            if (!Array.isArray(result)) return result;

            if (!params.args[2]) return bu.serializeTagArray(result, params.args[1]);

            if (isNaN(index)) return await Builder.errors.notANumber(params);

            if (!result[index]) return await Builder.util.error(params, 'Index out of range');

            return result[index];
        }).whenDefault(Builder.errors.tooManyArguments)
        .withProp('getVar', async function (params, varName = '') {
            for (const scope of bu.tagVariableScopes) {
                if (varName.startsWith(scope.prefix))
                    return await scope.getter(params, varName.substring(scope.prefix.length));
            }
            throw new Error('Missing default variable scope!');
        })
        .build();