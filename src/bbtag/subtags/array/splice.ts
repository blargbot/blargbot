import { Lazy } from '@blargbot/core/Lazy';
import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotAnArrayError, NotANumberError } from '../../errors';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.splice;

export class SpliceSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'splice',
            category: SubtagType.ARRAY,
            description: tag.description,
            definition: [
                {
                    parameters: ['array', 'start', 'deleteCount?:0'],
                    description: tag.delete.description,
                    exampleCode: tag.delete.exampleCode,
                    exampleOut: tag.delete.exampleOut,
                    returns: 'json[]',
                    execute: (ctx, [array, start, delCount]) => this.spliceArray(ctx, array.value, start.value, delCount.value, [])
                },
                {
                    parameters: ['array', 'start', 'deleteCount:0', 'items+'],
                    description: tag.replace.description,
                    exampleCode: tag.replace.exampleCode,
                    exampleOut: tag.replace.exampleOut,
                    returns: 'json[]',
                    execute: (ctx, [array, start, delCount, ...items]) => this.spliceArray(ctx, array.value, start.value, delCount.value, items.map(arg => arg.value))
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
    ): Promise<JArray> {
        const arr = await bbtag.tagArray.deserializeOrGetArray(context, arrStr);
        const fallback = new Lazy(() => parse.int(context.scopes.local.fallback ?? ''));

        if (arr === undefined)
            throw new NotAnArrayError(arrStr);

        const start = parse.int(startStr) ?? fallback.value;
        if (start === undefined)
            throw new NotANumberError(startStr);

        const delCount = parse.int(countStr) ?? fallback.value;
        if (delCount === undefined)
            throw new NotANumberError(countStr);

        const insert = bbtag.tagArray.flattenArray(replaceItems);
        const result = arr.v.splice(start, delCount, ...insert);
        if (arr.n !== undefined)
            await context.variables.set(arr.n, arr.v);

        return result;
    }
}
