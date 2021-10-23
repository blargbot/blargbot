import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, compare, parse, SubtagType } from '@cluster/utils';

const json = bbtagUtil.json;

export class JsonSortSubtag extends BaseSubtag {
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
                    execute: async (context, [{ value: arrStr }, { value: pathStr }, { value: descStr }], subtag): Promise<string | void> => {
                        let descending = parse.boolean(descStr);
                        if (descending === undefined)
                            descending = descStr !== '';

                        const arr = await bbtagUtil.tagArray.getArray(context, arrStr);
                        if (arr === undefined || !Array.isArray(arr.v))
                            return this.notAnArray(context, subtag);

                        if (pathStr === '')
                            return this.customError('No path provided', context, subtag);
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
                            return this.customError('Cannot read property ' + path.join('.') + ' at index ' + mappedArray.indexOf(undefined).toString() + ', ' + undefinedItems.length.toString() + ' total failures', context, subtag);
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

                        if (descending) arr.v.reverse();

                        if (arr.n === undefined)
                            return bbtagUtil.tagArray.serialize(arr.v);
                        await context.variables.set(arr.n, arr.v);
                    }
                }
            ]
        });
    }
}
