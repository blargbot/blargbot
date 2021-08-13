import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class MapSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'map',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['variable', 'array', '~code'],
                    description: 'Provides a way to populate an array by executing a function on each of its elements,' +
                        ' more info [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)\n' +
                        'For every element in `array`, a variable called `variable` will be set to the current element. The output of `function`' +
                        ' will be the new value of the element. This will return the new array, and will not modify the original.',
                    exampleCode: '{map;~item;["apples","oranges","pears"];{upper;{get;~item}}}',
                    exampleOut: '["APPLES","ORANGES","PEARS"]',
                    execute: async (context, args, subtag) => {
                        const varName = args[0].value;
                        const bbArr = await bbtagUtil.tagArray.getArray(context, args[1].value);
                        let array: JArray;
                        if (bbArr === undefined || !Array.isArray(bbArr.v))
                            array = [];
                        else
                            array = bbArr.v;
                        const newArray = [];

                        for (const item of array) {
                            const checked = await context.limit.check(context, subtag, 'map:loops');
                            if (checked !== undefined) {
                                newArray.push(this.tooManyLoops(context, subtag));
                                break;
                            }
                            await context.variables.set(varName, item);
                            const result = await args[2].execute();
                            newArray.push(result);
                            // try {
                            //     newArray.push(JSON.parse(result));
                            // } catch (e: unknown) {
                            //     newArray.push(result);
                            // }

                            if (context.state.return !== 0)
                                break;
                        }

                        await context.variables.reset(varName);
                        return bbtagUtil.tagArray.serialize(newArray);
                    }
                }
            ]
        });
    }
}

// module.exports =
//     Builder.ArrayTag('map')
//         .withArgs(a => [
//             a.required('variable'),
//             a.required('array'),
//             a.required('function')
//         ])
//         .withDesc('Provides a way to populate an array by executing a function on each of its elements,' +
//             ' more info [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)\n' +
//             'For every element in `array`, `variable` will be set and `function` will be executed. The output of `function`' +
//             ' will be the new value of the element. This will return the new array, and will not modify the original.'
//         )
//         .withExample(
//             '{map;~item;["apples","oranges","pears"];{upper;{get;~item}}}',
//             '["APPLES","ORANGES","PEARS"]'
//         )
//         .resolveArgs(0, 1)
//         .whenArgs('0-2', Builder.errors.notEnoughArguments)
//         .whenArgs('3', async function (subtag, context, args) {
//             const varName = args[0];
//             const arr = await bu.getArray(context, args[1]);
//             const array = Array.from(arr.v);
//             const newArray = [];

//             const remaining = context.state.limits.map || { loops: NaN };
//             for (const item of array) {
//                 remaining.loops--;
//                 if (!(remaining.loops >= 0)) {
//                     newArray.push(Builder.errors.tooManyLoops(subtag, context));
//                     break;
//                 }
//                 await context.variables.set(varName, item);
//                 newArray.push(await this.executeArg(subtag, args[2], context));

//                 if (context.state.return)
//                     break;
//             }

//             context.variables.reset(varName);
//             return bu.serializeTagArray(newArray);
//         }).whenDefault(Builder.errors.tooManyArguments)
//         .build();
