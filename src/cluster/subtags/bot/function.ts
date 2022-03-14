import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { BBTagRuntimeError } from '@blargbot/cluster/bbtag/errors';
import { Statement } from '@blargbot/cluster/types';
import { SubtagType } from '@blargbot/cluster/utils';

export class FunctionSubtag extends DefinedSubtag {
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
                    returns: 'nothing',
                    execute: (ctx, [name, code]) => this.createFunction(ctx, name.value, code.code)
                }
            ]
        });
    }

    public createFunction(
        context: BBTagContext,
        funcName: string,
        code: Statement
    ): void {
        let name = funcName.toLowerCase();
        if (name.startsWith('func.'))
            name = name.slice(5);

        if (name === '')
            throw new BBTagRuntimeError('Must provide a name');

        context.scopes.root.functions[name] = code;
    }
}
