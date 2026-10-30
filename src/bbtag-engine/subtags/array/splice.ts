import { Lazy } from '@blargbot/util';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotAnArrayError, NotANumberError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToInteger } from '../../utils/converters.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.splice;

type Features = VariablesFeature;
export class SpliceSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async spliceArray(
        context: BBTagContext,
        arrStr: string,
        startStr: string,
        countStr: string,
        replaceItems: string[]
    ): Promise<JArray> {
        const variables = this.#features.variables.forContext(context);
        const arr = await bbtag.tagArray.deserializeOrGetArray(variables, arrStr);
        const fallback = new Lazy(() => convertToInteger(context.local.fallback ?? ''));

        if (arr === undefined)
            throw new NotAnArrayError(arrStr);

        const start = convertToInteger(startStr) ?? fallback.value;
        if (start === undefined)
            throw new NotANumberError(startStr);

        const delCount = convertToInteger(countStr) ?? fallback.value;
        if (delCount === undefined)
            throw new NotANumberError(countStr);

        const insert = bbtag.tagArray.flattenArray(replaceItems);
        const result = arr.v.splice(start, delCount, ...insert);
        if (arr.n !== undefined)
            await variables.set(arr.n, arr.v);

        return result;
    }
}
