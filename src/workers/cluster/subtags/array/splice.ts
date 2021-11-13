import { BBTagContext, Subtag } from '@cluster/bbtag';
import { NotAnArrayError, NotANumberError } from '@cluster/bbtag/errors';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class SpliceSubtag extends Subtag {
    public constructor() {
        super({
            name: 'splice',
            category: SubtagType.ARRAY,
            desc: 'If used with a variable this will modify the original array.\nReturns an array of removed items.',
            definition: [
                {
                    parameters: ['array', 'start', 'deleteCount?:0'],
                    description: 'Removes `deleteCount` elements from `array` starting at `start`.',
                    exampleCode: '{splice;["this", "is", "an", "array"];1;1}',
                    exampleOut: '["is"]',
                    execute: (ctx, args) => this.spliceArray(ctx, args[0].value, args[1].value, args[2].value, [])
                },
                {
                    parameters: ['array', 'start', 'deleteCount:0', 'items+'],
                    description: 'Removes `deleteCount` elements from `array` starting at `start`. ' +
                        'Then, adds each `item` at that position in `array`. Returns the removed items.',
                    exampleCode: '{set;~array;["this", "is", "an", "array"]} {splice;{get;~array};1;1;was} {get;~array}',
                    exampleOut: '["is"] {"v":["this","was","an","array"],"n":"~array"}',
                    execute: (ctx, args) => this.spliceArray(ctx, args[0].value, args[1].value, args[2].value, args.slice(3).map(arg => arg.value))
                }
            ]
        });
    }

    public async spliceArray(
        context: BBTagContext,
        arrStr: string,
        startStr: string,
        countStr: string,
        replaceItems: string[]
    ): Promise<string> {
        const arr = await bbtagUtil.tagArray.getArray(context, arrStr);
        const fallback = new Lazy(() => parse.int(context.scopes.local.fallback ?? '', false));

        const insert = bbtagUtil.tagArray.flattenArray(replaceItems);
        if (arr === undefined || !Array.isArray(arr.v))
            throw new NotAnArrayError(replaceItems);

        const start = parse.int(startStr, false) ?? fallback.value;
        if (start === undefined)
            throw new NotANumberError(startStr);

        const delCount = parse.int(countStr, false) ?? fallback.value;
        if (delCount === undefined)
            throw new NotANumberError(countStr);

        const result = arr.v.splice(start, delCount, ...insert);
        if (arr.n !== undefined)
            await context.variables.set(arr.n, arr.v);

        return bbtagUtil.tagArray.serialize(result);
    }
}
