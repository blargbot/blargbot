import { Lazy } from '@blargbot/core/Lazy.js';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotAnArrayError, NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.splice;

@Subtag.id('splice')
@Subtag.factory(Subtag.arrayTools(), Subtag.converter())
export class SpliceSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;

    public constructor(arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
        super({
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

        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public async spliceArray(
        context: BBTagContext,
        arrStr: string,
        startStr: string,
        countStr: string,
        replaceItems: string[]
    ): Promise<JArray> {
        const arr = await this.#arrayTools.deserializeOrGetArray(context, arrStr);
        const fallback = new Lazy(() => this.#converter.int(context.scopes.local.fallback ?? ''));

        if (arr === undefined)
            throw new NotAnArrayError(arrStr);

        const start = this.#converter.int(startStr) ?? fallback.value;
        if (start === undefined)
            throw new NotANumberError(startStr);

        const delCount = this.#converter.int(countStr) ?? fallback.value;
        if (delCount === undefined)
            throw new NotANumberError(countStr);

        const insert = this.#arrayTools.flattenArray(replaceItems);
        const result = arr.v.splice(start, delCount, ...insert);
        if (arr.n !== undefined)
            await context.variables.set(arr.n, arr.v);

        return result;
    }
}
