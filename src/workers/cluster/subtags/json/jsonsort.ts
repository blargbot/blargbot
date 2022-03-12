import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError, NotAnArrayError } from '@cluster/bbtag/errors';
import { bbtag, compare, parse, SubtagType } from '@cluster/utils';

export class JsonSortSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'jsonsort',
            category: SubtagType.JSON,
            aliases: ['jsort'],
            definition: [
                {
                    parameters: ['array', 'path', 'descending?'],
                    description: 'Sorts an array of objects based on the provided `path`.\n' +
                        '`path` is a dot-noted series of properties.\n' +
                        'If `descending` is provided, sorts in descending order.\n' +
                        'If provided a variable, will modify the original `array`.',
                    exampleCode: '{set;~array;{json;[\n  {"points" : 10, "name" : "Blargbot"},\n  {"points" : 3, "name" : "UNO"},\n' +
                        '  {"points" : 6, "name" : "Stupid cat"},\n  {"points" : 12, "name" : "Winner"}\n]}}\n' +
                        '{jsonstringify;{jsonsort;{slice;{get;~array};0};points};2}',
                    exampleOut: '[\n  "{\\"points\\":3,\\"name\\":\\"UNO\\"}",\n  "{\\"points\\":6,\\"name\\":\\"Stupid cat\\"}",' +
                        '\n  "{\\"points\\":10,\\"name\\":\\"Blargbot\\"}",\n  "{\\"points\\":12,\\"name\\":\\"Winner\\"}"\n]',
                    returns: 'json[]|nothing',
                    execute: (ctx, [array, path, descending]) => this.jsonSort(ctx, array.value, path.value, descending.value)
                }
            ]
        });
    }

    public async jsonSort(context: BBTagContext, arrStr: string, pathStr: string, descStr: string): Promise<JArray | undefined> {
        const descending = parse.boolean(descStr) ?? descStr !== '';
        const obj = await bbtag.json.resolveObj(context, arrStr);
        if (!Array.isArray(obj.object))
            throw new NotAnArrayError(arrStr);

        const path = bbtag.json.getPathKeys(pathStr);
        const orderMult = descending ? -1 : 1;

        obj.object = obj.object.map(v => ({ value: v, sortKey: bbtag.json.get(v, path) }))
            .map((v, i, a) => {
                if (v.sortKey === undefined)
                    throw new BBTagRuntimeError(`Cannot read property ${pathStr} at index ${i}, ${a.filter(x => x.sortKey === undefined).length} total failures`);
                return { value: v.value, sortKey: parse.string(v.sortKey) };
            })
            .sort((a, b) => orderMult * compare(a.sortKey, b.sortKey))
            .map(x => x.value);

        if (obj.variable === undefined)
            return obj.object;

        await context.variables.set(obj.variable, obj.object);
        return undefined;
    }
}
