import { BBTagContext, Subtag } from '@cluster/bbtag';
import { SubtagStackOverflowError, UnknownSubtagError } from '@cluster/bbtag/errors';
import { RuntimeReturnState } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

export class FunctionInvokeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'func.',
            category: SubtagType.BOT,
            hidden: true,
            definition: [
                {
                    parameters: ['args*'],
                    execute: (ctx, args) => this.invokeFunction(ctx, args.subtagName.slice(5), args.map(arg => arg.value))
                }
            ]
        });
    }

    public async invokeFunction(context: BBTagContext, functionName: string, args: string[]): Promise<string> {
        const func = context.scopes.local.functions[functionName.toLowerCase()];
        if (func === undefined)
            throw new UnknownSubtagError(`func.${functionName}`);

        if (context.state.stackSize > 200) {
            context.state.return = RuntimeReturnState.ALL;
            throw new SubtagStackOverflowError(context.state.stackSize);
        }

        const scope = context.scopes.pushScope();
        context.state.stackSize++;
        try {
            scope.paramsarray = args;
            return await context.eval(func);
        } finally {
            context.state.stackSize--;
            context.scopes.popScope();
        }
    }
}
