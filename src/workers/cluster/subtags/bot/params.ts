import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';

export class ParamsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'params',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: 'Gets the whole input given to the current function call',
                    exampleCode: '{func;test;You gave the parameters `{params}`}\n{func.test;Hello world!;BBtag is so cool}',
                    exampleOut: 'You gave the parameters `Hello world! BBtag is so cool`',
                    execute: (ctx, _, subtag) => this.getAllParams(ctx, subtag)
                },
                {
                    parameters: ['index'],
                    description: 'Gets a parameter passed to the current function call',
                    exampleCode: '{func;test;The first parameter is `{params;0}`}\n{func.test;Hello world!;BBtag is so cool}',
                    exampleOut: 'The first parameter is `Hello world!`',
                    execute: (ctx, [index], subtag) => this.getParam(ctx, index.value, subtag)
                },
                {
                    parameters: ['start', 'end'],
                    description: 'Gets all the parameters given from `start` up to `end`. If `end` is `n` then all parameters after `start` will be returned',
                    exampleCode: '{func;test;The first parameter is `{params;2;4}`}\n{func.test;A;B;C;D;E;F}',
                    exampleOut: 'C D',
                    execute: (ctx, [start, end], subtag) => this.getParams(ctx, start.value, end.value, subtag)
                }
            ]
        });
    }

    public getAllParams(context: BBTagContext, subtag: SubtagCall): string {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            return context.addError('{params} can only be used inside {function}', subtag);
        return params.join(' ');
    }

    public getParam(context: BBTagContext, index: string, subtag: SubtagCall): string {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            return context.addError('{params} can only be used inside {function}', subtag);

        const i = parse.int(index);
        if (isNaN(i))
            return this.notANumber(context, subtag);

        return params[i];
    }

    public getParams(
        context: BBTagContext,
        start: string,
        end: string,
        subtag: SubtagCall
    ): string {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            return context.addError('{params} can only be used inside {function}', subtag);

        let from = parse.int(start);
        let to = end.toLowerCase() === 'n'
            ? params.length
            : parse.int(end);

        if (isNaN(from) || isNaN(to))
            return this.notANumber(context, subtag);

        // TODO This behaviour should be documented
        if (from > to)
            from = [to, to = from][0];

        if (params.length <= from || from < 0)
            return this.notEnoughArguments(context, subtag);

        return params.slice(from, to).join(' ');
    }
}
