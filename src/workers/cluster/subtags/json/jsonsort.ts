import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError, NotAnArrayError } from '@cluster/bbtag/errors';
import { bbtagUtil, compare, parse, SubtagType } from '@cluster/utils';

const json = bbtagUtil.json;

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
        const arr = await bbtagUtil.tagArray.deserializeOrGetArray(context, arrStr);
        if (arr === undefined)
            throw new NotAnArrayError(arrStr);

        if (pathStr === '')
            throw new BBTagRuntimeError('No path provided');
        const path = pathStr.split('.');
        const mappedArray = arr.v.map(item => {
            try {
                let baseObj: JObject | JArray;
                if (typeof item === 'string')
                    baseObj = json.parseSync(item);
                else if (typeof item !== 'object' || item === null)
                    baseObj = {};
                else
                    baseObj = item;

                const valueAtPath = json.get(baseObj, path);
                return valueAtPath;
            } catch (e: unknown) {
                return undefined;
            }
        });

        const undefinedItems = mappedArray.filter(v => v === undefined);
        if (undefinedItems.length !== 0) {
            throw new BBTagRuntimeError('Cannot read property ' + path.join('.') + ' at index ' + mappedArray.indexOf(undefined).toString() + ', ' + undefinedItems.length.toString() + ' total failures');
        }

        arr.v = arr.v.sort((a, b) => {
            let aObj: JObject | JArray;
            let bObj: JObject | JArray;
            if (typeof a === 'string')
                aObj = json.parseSync(a);
            else if (typeof a === 'object' && a !== null)
                aObj = a;
            else
                aObj = {};
            if (typeof b === 'string')
                bObj = json.parseSync(b);
            else if (typeof b === 'object' && b !== null)
                bObj = b;
            else
                bObj = {};

            const aValue = json.get(aObj, path);
            let aValueString: string;
            if (typeof aValue === 'object' && aValue !== null)
                aValueString = JSON.stringify(aValue);
            else if (aValue !== undefined && aValue !== null)
                aValueString = aValue.toString();
            else
                aValueString = '';
            const bValue = json.get(bObj, path);
            let bValueString: string;
            if (typeof bValue === 'object' && bValue !== null)
                bValueString = JSON.stringify(bValue);
            else if (bValue !== undefined && bValue !== null)
                bValueString = bValue.toString();
            else
                bValueString = '';
            return compare(aValueString, bValueString);
        });

        if (descending)
            arr.v.reverse();

        if (arr.n === undefined)
            return arr.v;
        await context.variables.set(arr.n, arr.v);
        return undefined;
    }
}
