/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:06
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-02-06 17:20:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('foreach')
        .withArgs(a => [
            a.require('variable'),
            a.require('array'),
            a.require('code')
        ])
        .withDesc('For every element in `array` `variable` will be set and then `code` will be run.')
        .withExample(
            '{set;~array;apples;oranges;c#}\n{foreach;~element;~array;I like {get;~element}{newline}}',
            'I like apples\nI like oranges\nI like c#'
        ).whenArgs('<4', Builder.util.notEnoughArguments)
        .whenArgs('4', async function (params) {
            let set = TagManager.list['set'],
                varName = await bu.processTagInner(params, 1),
                deserialized = await bu.getArray(params, await bu.processTagInner(params, 2)),
                arr = deserialized.v,
                result = '';

            if (!Array.isArray(arr))
                return await Builder.errors.notAnArray(params);

            console.verbose(arr);
            for (const item of arr) {
                params.msg.repeats = params.msg.repeats ? params.msg.repeats + 1 : 1;
                if (params.msg.repeats > 1500) {
                    result += await Builder.errors.tooManyLoops(params);
                    break;
                }
                await set.setVar(params, varName, item);
                result += await bu.processTagInner(params, 3);
                if (params.terminate)
                    break;
            }
            return result;
        }).whenDefault(Builder.util.tooManyArguments)
        .build();