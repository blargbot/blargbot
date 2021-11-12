import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagArgument } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

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
                    execute: (ctx, args) => this.createFunction(ctx, args[0].value, args[1])
                }
            ]
        });
    }

    public createFunction(
        context: BBTagContext,
        funcName: string,
        code: SubtagArgument
    ): string | void {
        let name = funcName.toLowerCase();
        if (name.startsWith('func.'))
            name = name.slice(5);

        if (name === '')
            throw new BBTagRuntimeError('Must provide a name');

        context.scopes.root.functions[name] = code.code;
    }
}
