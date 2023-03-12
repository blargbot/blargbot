import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotAnArrayError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools, BBTagOperators } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.sort;

@Subtag.names('sort')
@Subtag.ctorArgs('operators', 'arrayTools', 'converter')
export class SortSubtag extends CompiledSubtag {
    readonly #operators: BBTagOperators;
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;

    public constructor(operators: BBTagOperators, arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
        super({
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'descending?:false'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json[]|nothing',
                    execute: (ctx, [array, descending]) => this.sort(ctx, array.value, descending.value)
                }
            ]
        });

        this.#operators = operators;
        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public async sort(context: BBTagContext, arrayStr: string, descendingStr: string): Promise<JArray | undefined> {
        const arr = await this.#arrayTools.deserializeOrGetArray(context, arrayStr);
        if (arr === undefined)
            throw new NotAnArrayError(arrayStr);

        const descending = this.#converter.boolean(descendingStr, descendingStr !== '');
        const sorter = this.#operators.comparison[descending ? '<' : '>'];
        arr.v = arr.v.sort((a, b) => sorter(this.#converter.string(a), this.#converter.string(b)) ? 1 : -1);

        if (arr.n === undefined)
            return arr.v;

        await context.variables.set(arr.n, arr.v);
        return undefined;
    }
}
