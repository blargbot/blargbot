/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-05 17:19:13
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('concat')
        .withArgs(a => a.required('arrays', true))
        .withDesc('Takes `arrays` and joins them together to form a single array.')
        .withExample(
            '{concat;["this", "is"];["an", "array"]}',
            '["this","is","an","array"]'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let result = Builder.util.flattenArgArrays(args);
            return JSON.stringify(result);
        })
        .build();