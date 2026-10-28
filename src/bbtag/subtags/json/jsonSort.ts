import { compare } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotAnArrayError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToBoolean, convertToString } from '../../utils/converters.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.jsonSort;

type Features = VariablesFeature;
export class JsonSortSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'jsonSort',
            category: SubtagType.JSON,
            aliases: ['jSort'],
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
        this.#features = features;
    }

    public async jsonSort(context: BBTagContext, arrStr: string, pathStr: string, descStr: string): Promise<JArray | undefined> {
        const variables = this.#features.variables.forContext(context);
        const descending = convertToBoolean(descStr) ?? descStr !== '';
        const obj = await bbtag.json.resolveObj(variables, arrStr);
        if (!Array.isArray(obj.object))
            throw new NotAnArrayError(arrStr);

        const path = bbtag.json.getPathKeys(pathStr);
        const orderMult = descending ? -1 : 1;

        obj.object = obj.object.map(v => ({ value: v, sortKey: bbtag.json.get(v, path) }))
            .map((v, i, a) => {
                if (v.sortKey === undefined)
                    throw new BBTagRuntimeError(`Cannot read property ${pathStr} at index ${i}, ${a.filter(x => x.sortKey === undefined).length} total failures`);
                return { value: v.value, sortKey: convertToString(v.sortKey) };
            })
            .sort((a, b) => orderMult * compare(a.sortKey, b.sortKey))
            .map(x => x.value);

        if (obj.variable === undefined)
            return obj.object;

        await variables.set(obj.variable, obj.object);
        return undefined;
    }
}
