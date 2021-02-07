/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:56
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-11 18:29:34
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('pop')
        .withArgs(a => a.required('array'))
        .withDesc('Returns the last element in `array`. If provided a variable, this will remove the last element from `array` as well.')
        .withExample(
            '{pop;["this", "is", "an", "array"]}',
            'array'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            let arr = await bu.getArray(context, args[0]), result;

            if (arr == null || !Array.isArray(arr.v))
                return Builder.errors.notAnArray(subtag, context);

            result = arr.v.pop();
            if (arr.n != null)
                await context.variables.set(arr.n, arr.v);

            return result;
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();