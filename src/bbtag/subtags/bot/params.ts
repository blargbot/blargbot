import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, NotANumberError, NotEnoughArgumentsError } from '../../errors';
import { SubtagType } from '../../utils';

export class ParamsSubtag extends CompiledSubtag {
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
                    returns: 'string',
                    execute: (ctx) => this.getAllParams(ctx)
                },
                {
                    parameters: ['index'],
                    description: 'Gets a parameter passed to the current function call',
                    exampleCode: '{func;test;The first parameter is `{params;0}`}\n{func.test;Hello world!;BBtag is so cool}',
                    exampleOut: 'The first parameter is `Hello world!`',
                    returns: 'string',
                    execute: (ctx, [index]) => this.getParam(ctx, index.value)
                },
                {
                    parameters: ['start', 'end'],
                    description: 'Gets all the parameters given from `start` up to `end`. If `end` is `n` then all parameters after `start` will be returned',
                    exampleCode: '{func;test;The first parameter is `{params;2;4}`}\n{func.test;A;B;C;D;E;F}',
                    exampleOut: 'C D',
                    returns: 'string',
                    execute: (ctx, [start, end]) => this.getParams(ctx, start.value, end.value)
                }
            ]
        });
    }

    public getAllParams(context: BBTagContext): string {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            throw new BBTagRuntimeError('{params} can only be used inside {function}');
        return params.join(' ');
    }

    public getParam(context: BBTagContext, index: string): string {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            throw new BBTagRuntimeError('{params} can only be used inside {function}');

        const i = parse.int(index);
        if (isNaN(i))
            throw new NotANumberError(index);

        if (params.length <= i || i < 0)
            throw new NotEnoughArgumentsError(i, params.length);

        return params[i];
    }

    public getParams(
        context: BBTagContext,
        start: string,
        end: string
    ): string {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            throw new BBTagRuntimeError('{params} can only be used inside {function}');

        let from = parse.int(start, false);
        if (from === undefined)
            throw new NotANumberError(start);

        let to = end.toLowerCase() === 'n'
            ? params.length
            : parse.int(end, false);

        if (to === undefined)
            throw new NotANumberError(end);

        // TODO This behaviour should be documented
        if (from > to)
            from = [to, to = from][0];

        if (params.length <= from || from < 0)
            throw new NotEnoughArgumentsError(from, params.length);

        return params.slice(from, to).join(' ');
    }
}
