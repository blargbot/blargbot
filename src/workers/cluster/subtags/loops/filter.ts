import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, overrides, parse, SubtagType } from '@cluster/utils';

export class FilterSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'filter',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'array', '~code'],
                    description: 'For every element in `array`, a variable called `variable` will be set and `code` will be executed. Returns a new array containing all the elements that returned the value `true`.' +
                        '\n\n While inside the `code` parameter, none of the following subtags may be used: `' + overrides.filter.join(', ') + '`',
                    exampleCode: '{set;~array;apples;apple juice;grapefruit}\n{filter;~element;~array;{bool;{get;~element};startswith;apple}}',
                    exampleOut: '["apples","apple juice"]',
                    execute: async (context, args, subtag) => {
                        const varName = args[0].value;
                        let arr = await bbtagUtil.tagArray.getArray(context, args[1].value);
                        if (arr === undefined)
                            arr = { v: args[1].value.split('') };
                        const result = [];
                        const array = Array.from(arr.v);

                        const processed: Record<string, boolean> = {};
                        for (const item of array) {
                            const stringifiedItem = parse.string(item);
                            if (processed[stringifiedItem]) continue;
                            await context.limit.check(context, subtag, 'filter:loops');
                            await context.variables.set(varName, item);
                            try {
                                const res = await args[2].execute();
                                if (context.state.return !== 0)
                                    break;
                                if (parse.boolean(res) === true) {
                                    processed[stringifiedItem] = true;
                                    //If item 'e' is an object, it stringifies it for comparison. Otherwise it will always return false
                                    result.push(...array.filter(e => stringifiedItem === parse.string(e)));
                                }
                            } catch (err: unknown) {//? What is this?
                                // if (typeof err === 'function') {
                                //     return err(subtag, context);
                                // }
                                // throw err;
                            }
                        }
                        await context.variables.reset(varName);
                        return JSON.stringify(result);
                    }
                }
            ]
        });
    }
}
