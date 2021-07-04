/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:19
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-11 18:30:11
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('shift')
        .withArgs(a => a.required('array'))
        .withDesc('Returns the first element in `array`. If used with a variable this will remove the first element from `array` as well.')
        .withExample(
            '{shift;["this", "is", "an", "array"]}',
            'this'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            let arr = await bu.getArray(context, args[0]);
            if (arr == null || !Array.isArray(arr.v))
                return Builder.errors.notAnArray(subtag, context);

            let result = arr.v.shift();
            if (arr.n)
                await context.variables.set(arr.n, arr.v);

            return result;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
