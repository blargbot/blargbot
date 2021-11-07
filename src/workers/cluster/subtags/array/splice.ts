import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class SpliceSubtag extends BaseSubtag {
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
                    execute: (ctx, args, subtag) => this.spliceArray(ctx, args[0].value, args[1].value, args[2].value, [], subtag)
                },
                {
                    parameters: ['array', 'start', 'deleteCount:0', 'items+'],
                    description: 'Removes `deleteCount` elements from `array` starting at `start`. ' +
                        'Then, adds each `item` at that position in `array`. Returns the removed items.',
                    exampleCode: '{set;~array;["this", "is", "an", "array"]} {splice;{get;~array};1;1;was} {get;~array}',
                    exampleOut: '["is"] {"v":["this","was","an","array"],"n":"~array"}',
                    execute: (ctx, args, subtag) => this.spliceArray(ctx, args[0].value, args[1].value, args[2].value, args.slice(3).map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public async spliceArray(
        context: BBTagContext,
        arrStr: string,
        startStr: string,
        countStr: string,
        replaceItems: string[],
        subtag: SubtagCall
    ): Promise<string> {
        const arr = await bbtagUtil.tagArray.getArray(context, arrStr);
        let start = parse.int(startStr);
        let delCount = parse.int(countStr);
        const fallback = parse.int(context.scopes.local.fallback !== undefined ? context.scopes.local.fallback : '');
        const insert = bbtagUtil.tagArray.flattenArray(replaceItems);

        if (arr === undefined || !Array.isArray(arr.v))
            return this.notAnArray(context, subtag);

        if (isNaN(start)) start = fallback;
        if (isNaN(delCount)) delCount = fallback;
        if (isNaN(start))
            return this.notANumber(context, subtag, `${startStr} is not a number`);
        if (isNaN(delCount))
            return this.notANumber(context, subtag, `${countStr} is not a number`);

        const result = arr.v.splice(start, delCount, ...insert);
        if (arr.n !== undefined)
            await context.variables.set(arr.n, arr.v);

        return bbtagUtil.tagArray.serialize(result);
    }
}
