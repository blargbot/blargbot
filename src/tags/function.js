/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:28
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-21 14:34:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    engine = require('../structures/bbtag/Engine'),
    argsTag = require('./args');

function parameters(parameters) {
    return async function (subtag, context) {
        let args = await Promise.all(subtag.children.slice(1).map(arg => engine.execute(arg, context)));
        if (args.length === 0)
            return parameters.join(' ');
        return await argsTag.getArgs(subtag, context, args, parameters);
    };
}

module.exports =
    Builder.AutoTag('function')
        .withArgs(a => [a.require('name'), a.require('code')])
        .withDesc('WIP')
        .withExample(
            '{function;test;{paramsarray}} {test;1;2;3;4}',
            '["1","2","3","4"]'
        )
        .resolveArgs(0)
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (subtag, context, args) {
            let name = args[0].toLowerCase();
            let code = args[1];

            if (!name) return Builder.util.error(subtag, context, 'Must provide a name');
            if (!name.startsWith('~'))
                name = '~' + name;

            context.override(name, async function (subtag, context) {
                args = await Promise.all(subtag.children.slice(1).map(arg => engine.execute(arg, context)));
                context.override('params', parameters(args));
                context.override('paramsarray', () => JSON.stringify(args));
                context.override('paramslength', () => args.length);

                return await engine.execute(code, context);
            });
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();