import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagArgumentValue, SubtagCall } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';

function parameters(this: BaseSubtag, context: BBTagContext, subtag: SubtagCall, args: string[], start?: string, end?: string): string {
    if (start === undefined) {
        return args.join(' ');
    }
    let from = parse.int(start);
    if (end === undefined) {
        if (isNaN(from))
            return this.notANumber(context, subtag);
        return args[from];
    }
    let to = end.toLowerCase() === 'n'
        ? args.length
        : parse.int(end);

    if (isNaN(from) || isNaN(to))
        return this.notANumber(context, subtag);

    // TODO This behaviour should be documented
    if (from > to)
        from = [to, to = from][0];

    if (to > args.length || from < 0)
        return this.notEnoughArguments(context, subtag);
    return args.slice(from, to).join(' ');
}
export class FunctionSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'function',
            category: SubtagType.BOT,
            aliases: ['func'],
            definition: [
                {
                    parameters: ['name', '~code'],
                    description: 'Defines a function called `name`. Functions are called in the same way as subtags, however they are prefixed with `func.`. ' +
                    'While inside the `code` block of a function, you may use the `params`, `paramsarray` and `paramslength` subtags to access the values ' +
                    'passed to the function. These function identically to their `args` counterparts. ' +
                    '\n\nPlease note that there is a recursion limit of 200 which is also shared by `{exec}`, `{execcc}` and `{inject}`.',
                    exampleCode: '{function;test;{paramsarray}} {func.test;1;2;3;4}',
                    exampleOut: '["1","2","3","4"]',
                    execute: (ctx, args, subtag) => this.createFunction(ctx, args[0].value, args[1], subtag)
                }
            ]
        });
    }

    public createFunction(
        context: BBTagContext,
        funcName: string,
        code: SubtagArgumentValue,
        subtag: SubtagCall
    ): string | void {
        let name = funcName.toLowerCase();

        if (name === '')
            return this.customError('Must provide a name', context, subtag);
        if (!name.startsWith('func.'))
            name = 'func.' + name;

        context.override(name, {
            execute: async (_context: BBTagContext, _subtagName: string, _subtag: SubtagCall) => {
                if (context.state.stackSize >= 200) {
                    context.state.return = -1;
                    return this.customError('Terminated recursive tag after ' + context.state.stackSize.toString() + ' execs.', context, subtag);
                }
                const args = await Promise.all(_subtag.args.map(arg => context.eval(arg)));
                const overrides = [];
                overrides.push(
                    context.override('params', {
                        execute: async (_, __, paramsSubtag) => {
                            const _args = await Promise.all(paramsSubtag.args.map(arg => context.eval(arg)));
                            return parameters.call(this, context, subtag, args, _args[0], _args[1]);
                        }
                    }),
                    context.override('paramsarray', {
                        execute: () => JSON.stringify(args)
                    }),
                    context.override('paramslength', {
                        execute: () => args.length.toString()
                    })
                );
                context.state.stackSize++;
                try {
                    return await code.execute();
                } finally {
                    context.state.stackSize--;
                    overrides.forEach(override => override.revert());
                }
            }
        });
    }
}

// const Builder = require('../structures/TagBuilder');
// const argsTag = require('./args');

// function parameters(parameters) {
//     return async function (subtag, context) {
//         const args = await Promise.all(subtag.children.slice(1).map(arg => this.executeArg(subtag, arg, context)));
//         if (args.length === 0)
//             return parameters.join(' ');
//         return await argsTag.getArgs(subtag, context, args, parameters);
//     }.bind(this);
// }

// module.exports =
//     Builder.AutoTag('function')
//         .withAlias('func')
//         .withArgs(a => [a.required('name'), a.required('code')])
//         .withDesc('Defines a function called `name`. Functions are called in the same way as subtags, however they are prefixed with `func.`. ' +
//             'While inside the `code` block of a function, you may use the `params`, `paramsarray` and `paramslength` subtags to access the values ' +
//             'passed to the function. These function identically to their `args` counterparts. ' +
//             '\n\nPlease note that there is a recursion limit of 200 which is also shared by `{exec}`, `{execcc}` and `{inject}`.')
//         .withExample(
//             '{function;test;{paramsarray}} {func.test;1;2;3;4}',
//             '["1","2","3","4"]'
//         )
//         .resolveArgs(0)
//         .whenArgs('0-1', Builder.errors.notEnoughArguments)
//         .whenArgs('2', async function (subtag, context, args) {
//             let name = args[0].toLowerCase();
//             const code = args[1];

//             if (!name) return Builder.util.error(subtag, context, 'Must provide a name');
//             if (!name.startsWith('func.'))
//                 name = 'func.' + name;

//             context.override(name, async function (subtag, context) {
//                 if (context.state.stackSize >= 200) {
//                     context.state.return = -1;
//                     return Builder.util.error(subtag, context, 'Terminated recursive tag after ' + context.state.stackSize + ' execs.');
//                 }

//                 args = await Promise.all(subtag.children.slice(1).map(arg => this.executeArg(subtag, arg, context)));
//                 const overrides = [];
//                 overrides.push(context.override('params', parameters.call(this, args)));
//                 overrides.push(context.override('paramsarray', () => JSON.stringify(args)));
//                 overrides.push(context.override('paramslength', () => args.length));

//                 context.state.stackSize++;
//                 try {
//                     return await this.executeArg(subtag, code, context);
//                 } finally {
//                     context.state.stackSize--;
//                     overrides.forEach(override => override.revert());
//                 }
//             }.bind(this));
//         })
//         .whenDefault(Builder.errors.tooManyArguments)
//         .build();
