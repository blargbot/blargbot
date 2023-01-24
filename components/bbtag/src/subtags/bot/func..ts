import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UnknownSubtagError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import { SubtagType } from '../../utils/index.js';

@Subtag.id('func.')
@Subtag.factory()
export class FunctionInvokeSubtag extends CompiledSubtag {
    public constructor() {
        super({
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
        const func = context.scopes.local.functions[functionName.toLowerCase()];
        if (func === undefined)
            throw new UnknownSubtagError(`func.${functionName}`);

        return await context.withStack(() => context.withScope(async scope => {
            scope.paramsarray = args;
            return await context.eval(func);
        }));
    }
}
