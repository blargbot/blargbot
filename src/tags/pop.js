/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:56
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:56
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('pop')
        .withArgs(a => a.require('array'))
        .withDesc('Returns the last element in `array`. If used with `{get}` this will remove the last element from `array` as well.')
        .withExample(
            '{pop;["this", "is", "an", "array"]}',
            'array'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) {
            let arr = await bu.getArray(params, params.args[1]), result;

            if (arr == null || !Array.isArray(arr.v))
                return await Builder.errors.notAnArray(params);

            result = arr.v.pop();
            if (arr.n != null)
                await bu.setArray(arr, params);

            return result;
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();