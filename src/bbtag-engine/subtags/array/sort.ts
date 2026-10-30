import { compareNaturalSortKeys, sortBy, toNaturalSortKey } from '@blargbot/util';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotAnArrayError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToBoolean, convertToString } from '../../utils/converters.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.sort;

type Features = VariablesFeature;
export class SortSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'sort',
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
        this.#features = features;
    }

    public async sort(context: BBTagContext, arrayStr: string, descendingStr: string): Promise<JArray | undefined> {
        const variables = this.#features.variables.forContext(context);
        const arr = await bbtag.tagArray.deserializeOrGetArray(variables, arrayStr);
        if (arr === undefined)
            throw new NotAnArrayError(arrayStr);

        const direction = convertToBoolean(descendingStr) ?? descendingStr !== '' ? -1 : 1;
        arr.v = sortBy(
            arr.v,
            v => toNaturalSortKey(convertToString(v)),
            (a, b) => direction * compareNaturalSortKeys(a, b)
        );

        if (arr.n === undefined)
            return arr.v;

        await variables.set(arr.n, arr.v);
        return undefined;
    }
}
