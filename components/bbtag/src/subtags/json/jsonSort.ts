import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotAnArrayError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagJsonTools, BBTagOperators } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.jsonSort;

@Subtag.names('jsonSort', 'jSort')
@Subtag.ctorArgs('operators', 'jsonTools', 'converter')
export class JsonSortSubtag extends CompiledSubtag {
    readonly #operators: BBTagOperators;
    readonly #jsonTools: BBTagJsonTools;
    readonly #converter: BBTagValueConverter;

    public constructor(operators: BBTagOperators, jsonTools: BBTagJsonTools, converter: BBTagValueConverter) {
        super({
            category: SubtagType.JSON,
            definition: [
                {
                    parameters: ['array', 'path', 'descending?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json[]|nothing',
                    execute: (ctx, [array, path, descending]) => this.jsonSort(ctx, array.value, path.value, descending.value)
                }
            ]
        });

        this.#operators = operators;
        this.#jsonTools = jsonTools;
        this.#converter = converter;
    }

    public async jsonSort(context: BBTagContext, arrStr: string, pathStr: string, descStr: string): Promise<JArray | undefined> {
        const descending = this.#converter.boolean(descStr) ?? descStr !== '';
        const obj = await this.#jsonTools.resolveObj(context, arrStr);
        if (!Array.isArray(obj.object))
            throw new NotAnArrayError(arrStr);

        const path = this.#jsonTools.getPathKeys(pathStr);
        const sorter = this.#operators.comparison[descending ? '<' : '>'];

        obj.object = obj.object.map(v => ({ value: v, sortKey: this.#jsonTools.get(v, path) }))
            .map((v, i, a) => {
                if (v.sortKey === undefined)
                    throw new BBTagRuntimeError(`Cannot read property ${pathStr} at index ${i}, ${a.filter(x => x.sortKey === undefined).length} total failures`);
                return { value: v.value, sortKey: this.#converter.string(v.sortKey) };
            })
            .sort((a, b) => sorter(a.sortKey, b.sortKey) ? 1 : -1)
            .map(x => x.value);

        if (obj.variable === undefined)
            return obj.object;

        await context.variables.set(obj.variable, obj.object);
        return undefined;
    }
}
