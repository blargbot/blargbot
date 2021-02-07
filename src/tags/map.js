/**
 * @Author: RagingLink
 * @Date: 2020-06-03 23:26:05
 * @Last Modified by: RagingLink
 * @Last Modified time: 2020-07-17 22:17:35
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('map')
        .withArgs(a => [
            a.required('variable'),
            a.required('array'),
            a.required('function')
        ])
        .withDesc('Provides a way to populate an array by executing a function on each of its elements,' +
            ' more info [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)\n' +
            'For every element in `array`, `variable` will be set and `function` will be executed. The output of `function`' +
            ' will be the new value of the element. This will return the new array, and will not modify the original.'
        )
        .withExample(
            '{map;~item;["apples","oranges","pears"];{upper;{get;~item}}}',
            '["APPLES","ORANGES","PEARS"]'
        )
        .resolveArgs(0, 1)
        .whenArgs('0-2', Builder.errors.notEnoughArguments)
        .whenArgs('3', async function (subtag, context, args) {
            let varName = args[0],
                arr = await bu.getArray(context, args[1]),
                array = Array.from(arr.v),
                newArray = [];

            let remaining = context.state.limits.map || { loops: NaN };
            for (const item of array) {
                remaining.loops--;
                if (!(remaining.loops >= 0)) {
                    newArray.push(Builder.errors.tooManyLoops(subtag, context));
                    break;
                }
                await context.variables.set(varName, item);
                newArray.push(await this.executeArg(subtag, args[2], context));

                if (context.state.return)
                    break;
            };

            context.variables.reset(varName);
            return bu.serializeTagArray(newArray);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();
