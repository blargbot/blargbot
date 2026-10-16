import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UnknownSubtagError } from '../../errors/index.js';
import { SubtagType } from '../../utils/index.js';

export class FunctionInvokeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'func.',
            category: SubtagType.BOT,
            hidden: true,
            definition: [
                {
                    parameters: ['args*'],
                    returns: 'string',
                    execute: (ctx, args) => this.invokeFunction(ctx, args.subtagName.slice(5), args.map(arg => arg.value))
                }
            ]
        });
    }

    public async invokeFunction(context: BBTagContext, functionName: string, args: string[]): Promise<string> {
        const func = context.root.functions.get(functionName.toLowerCase());
        if (func === undefined)
            throw new UnknownSubtagError(`func.${functionName}`);

        using _stack = context.enterRecursion();
        using scope = context.enterScope();
        scope.paramsarray = args;
        return await context.eval(func);
    }
}
