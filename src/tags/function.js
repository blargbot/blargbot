/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:28
 * @Last Modified by: SarahShmarah
 * @Last Modified time: 2018-07-18 20:21:03
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    argsTag = require('./args');

function parameters(parameters) {
    return (async function (subtag, context) {
        let args = await Promise.all(subtag.children.slice(1).map(arg => this.executeArg(subtag, arg, context)));
        if (args.length === 0)
            return parameters.join(' ');
        return await argsTag.getArgs(subtag, context, args, parameters);
    }).bind(this);
}

module.exports =
    Builder.AutoTag('function')
        .withAlias('func')
        .withArgs(a => [a.require('name'), a.require('code')])
        .withDesc('Defines a function called `name`. Functions are called in the same way as subtags, however they are prefixed with `func.`. ' +
            'While inside the `code` block of a function, you may use the `params`, `paramsarray` and `paramslength` subtags to access the values ' +
            'passed to the function. These function identically to their `args` counterparts. ' +
            '\n\nPlease note that the there is a recursion limit of 200 which is also shared by `{exec}`, `{execcc}` and `{inject}`.')
        .withExample(
            '{function;test;{paramsarray}} {func.test;1;2;3;4}',
            '["1","2","3","4"]'
        )
        .resolveArgs(0)
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (subtag, context, args) {
            let name = args[0].toLowerCase();
            let code = args[1];

            if (!name) return Builder.util.error(subtag, context, 'Must provide a name');
            if (!name.startsWith('func.'))
                name = 'func.' + name;

            context.override(name, (async function (subtag, context) {
                if (context.state.stackSize >= 200) {
                    context.state.return = -1;
                    return Builder.util.error(subtag, context, 'Terminated recursive tag after ' + context.state.stackSize + ' execs.');
                }

                args = await Promise.all(subtag.children.slice(1).map(arg => this.executeArg(subtag, arg, context)));
                let overrides = [];
                overrides.push(context.override('params', parameters.call(this, args)));
                overrides.push(context.override('paramsarray', () => JSON.stringify(args)));
                overrides.push(context.override('paramslength', () => args.length));

                context.state.stackSize++;
                try {
                    return await this.executeArg(subtag, code, context);
                } finally {
                    context.state.stackSize--;
                    overrides.forEach(override => override.revert());
                }
            }).bind(this));
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
