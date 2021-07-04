/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:59
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-11 18:30:01
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('splice')
        .withArgs(a => [a.required('array'), a.required('start'), a.optional('deleteCount'), a.optional('items', true)])
        .withDesc('Removes `deleteCount` elements (defaults to 0) from `array` starting at `start`. ' +
            'Then, adds each `item` at that position in `array`. Returns the removed items. ' +
            'If used with a variable this will modify the original array')
        .withExample(
            '{set;~array;["this", "is", "an", "array"]} {splice;{get;~array};1;1;was} {get;~array}',
            '["is"] {"v":["this","was","an","array"],"n":"~array"}'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let arr = await bu.getArray(context, args[0]);
            let start = bu.parseInt(args[1]);
            let delCount = bu.parseInt(args[2] || 0);
            let fallback = bu.parseInt(context.scope.fallback);
            let insert = Builder.util.flattenArgArrays(args.slice(3));

            if (arr == null || !Array.isArray(arr.v))
                return Builder.errors.notAnArray(subtag, context);

            if (isNaN(start)) start = fallback;
            if (isNaN(delCount)) delCount = fallback;
            if (isNaN(start) || isNaN(delCount))
                return Builder.errors.notANumber(subtag, context);

            let result = arr.v.splice(start, delCount, ...insert);
            if (arr.n)
                await context.variables.set(arr.n, arr.v);

            return bu.serializeTagArray(result);
        })
        .build();
