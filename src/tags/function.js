/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:28
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-10-07 16:20:59
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const { FlowState } = require('../structures/bbtag/FlowControl');
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
            'While inside the `code` block of a function, you may use the `functionreturn`, `functionyield`, `params`, `paramsarray` and `paramslength` subtags to access the values ' +
            'passed to the function. These function identically to their `args` counterparts. ' +
            '\n\nPlease note that there is a recursion limit of 200 which is also shared by `{exec}`, `{execcc}` and `{inject}`.')
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

            context.override(name, (async function (subtag, /** @type {import('../structures/bbtag/Context')} */context) {
                args = await Promise.all(subtag.children.slice(1).map(arg => this.executeArg(subtag, arg, context)));
                const childContext = context.makeChild();
                let overrides = [];
                let funcResult = null;
                overrides.push(childContext.override('params', parameters.call(this, args)));
                overrides.push(childContext.override('paramsarray', () => JSON.stringify(args)));
                overrides.push(childContext.override('paramslength', () => args.length));
                overrides.push(childContext.override(['functionreturn', 'funcreturn'], async (subtag, ctx) => {
                    if (subtag.children.length >= 1)
                        funcResult = await this.executeArg(subtag, subtag.children[1], context);
                    ctx.state.flowState = FlowState.KILL_FUNC;
                }));
                overrides.push(childContext.override(['functionyield', 'funcyield'], async (subtag, ctx) => {
                    if (funcResult === null)
                        funcResult = '';
                    if (subtag.children.length >= 1)
                        funcResult += await this.executeArg(subtag, subtag.children[1], context);
                }));

                try {
                    funcResult = null;
                    const result = await this.executeArg(subtag, code, childContext);
                    if (childContext.state.flowState === FlowState.KILL_FUNC)
                        childContext.state.flowState = FlowState.NORMAL;
                    if (funcResult !== null)
                        return funcResult;
                    return result;
                } finally {
                    overrides.forEach(override => override.revert());
                }
            }).bind(this));
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
