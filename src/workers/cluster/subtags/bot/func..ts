import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { RuntimeReturnState, SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

export class FunctionInvokeSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'func.',
            category: SubtagType.BOT,
            hidden: true,
            definition: [
                {
                    parameters: ['args*'],
                    execute: (ctx, args, subtag) => this.invokeFunction(ctx, args.subtagName.slice(5), args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public async invokeFunction(context: BBTagContext, functionName: string, args: string[], subtag: SubtagCall): Promise<string> {
        const func = context.scopes.local.functions[functionName.toLowerCase()];
        if (func === undefined)
            return context.addError(`Unknown subtag func.${functionName}`, subtag);

        if (context.state.stackSize > 200) {
            context.state.return = RuntimeReturnState.ALL;
            throw new BBTagRuntimeError(`Terminated recursive tag after ${context.state.stackSize} execs.`);
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
