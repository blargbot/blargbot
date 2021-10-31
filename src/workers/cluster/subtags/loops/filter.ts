import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
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
                        const subtagOverrides = [];
                        const childContext = context.makeChild();
                        for (const name of overrides.filter) {
                            subtagOverrides.push(childContext.override(name, {
                                execute: (_context: BBTagContext, subtagName: string, _subtag: SubtagCall) => {
                                    return this.customError(`Subtag {${subtagName}} is disabled inside {filter}`, _context, _subtag);
                                }
                            }));
                        }
                        for (const item of array) {
                            const stringifiedItem = parse.string(item);
                            if (processed[stringifiedItem]) continue;
                            if (await context.limit.check(context, subtag, 'filter:loops') !== undefined) {
                                for (const override of subtagOverrides) {
                                    override.revert();
                                }
                                return this.customError('Max safeloops reached', context, subtag);
                            }

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
                        for (const override of subtagOverrides) {
                            override.revert();
                        }
                        await context.variables.reset(varName);
                        return JSON.stringify(result);
                    }
                }
            ]
        });
    }
}

// const Builder = require('../structures/TagBuilder');
// const bbengine = require('../structures/bbtag/Engine');
// const waitMessage = require('./waitmessage');

// module.exports =
//     Builder.ArrayTag('filter')
//         .withArgs(a => [
//             a.required('variable'),
//             a.required('array'),
//             a.required('code')
//         ])
//         .withDesc('For every element in `array`, `variable` will be set and then `code` will be run. Returns a new array containing all the elements that returned the value `true`.\n' +
//             '\n\n While inside the `condition` parameter, none of the following subtags may be used: `' + waitMessage.overrideSubtags.join(', ') + '`')
//         .withExample(
//             '{set;~array;apples;apple juice;grapefruit}\n{filter;~element;~array;{bool;{get;~element};startswith;apple}}',
//             '["apples","apple juice"]'
//         ).resolveArgs(0, 1)
//         .whenArgs('0-2', Builder.errors.notEnoughArguments)
//         .whenArgs(3, async function (subtag, context, args) {
//             const varName = args[0];
//             const arr = await bu.getArray(context, args[1]) || { v: args[1].split('') };
//             const result = [];
//             const array = Array.from(arr.v);

//             const checkFunc = waitMessage.createCheck(subtag, context, args[2], (msg) => {
//                 return context.makeChild({ msg });
//             });

//             const processed = {};
//             let i = 0;

//             for (const item of array) {
//                 const stringifiedItem = typeof item === 'object' ? JSON.stringify(item) : null;
//                 if (processed[stringifiedItem || item]) continue;
//                 if (await bbengine.safeLoopIteration(context)) {
//                     return Builder.errors.maxSafeLoops(subtag, context);
//                 }

//                 await context.variables.set(varName, item);
//                 try {
//                     const res = await checkFunc(context.msg, item);
//                     if (context.state.return)
//                         break;
//                     if (res) {
//                         processed[stringifiedItem || item] = true;
//                         //If item 'e' is an object, it stringifies it for comparison. Otherwise it will always return false
//                         result.push(...array.filter(e => typeof e === 'object' ? JSON.stringify(e) === stringifiedItem : e === item));
//                     }
//                     if (i++ % 1000 === 0)
//                         await this.sleep();
//                 } catch (err) {
//                     if (typeof err === 'function') {
//                         return err(subtag, context);
//                     }
//                     throw err;
//                 }
//             }
//             context.variables.reset(varName);
//             return JSON.stringify(result);
//         }).whenDefault(Builder.errors.tooManyArguments)
//         .withProp('sleep', function (time = 100) {
//             return new Promise(res => {
//                 setTimeout(res, time);
//             });
//         })
//         .build();
