/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:06
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-24 13:12:48
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
        .withDesc('For every element in `array`, `variable` will be set and then `code` will be run.')
        .withExample(
            '{set;~array;apples;oranges;c#}\n{foreach;~element;~array;I like {get;~element}{newline}}',
            'I like apples\nI like oranges\nI like c#'
        ).resolveArgs(0, 1)
        .whenArgs('0-2', Builder.errors.notEnoughArguments)
        .whenArgs(3, async function (subtag, context, args) {
            let varName = args[0],
                arr = await bu.getArray(context, args[1]) || { v: args[1].split('') },
                result = '';
            let array = Array.from(arr.v);
            for (const item of array) {
                if (++context.state.count.foreach > 3000) {
                    result += Builder.errors.tooManyLoops(subtag, context);
                    break;
                }
                await context.variables.set(varName, item);
                result += await this.executeArg(subtag, args[2], context);
                if (context.state.return)
                    break;
            }
            context.variables.reset(varName);
            return result;
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();