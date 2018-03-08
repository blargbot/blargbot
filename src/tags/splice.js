/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:59
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:58:28
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('splice')
        .withArgs(a => [a.require('array'), a.require('start'), a.optional('deleteCount'), a.optional('items', true)])
        .withDesc('Removes `deleteCount` elements (defaults to 0) from `array` starting at `start`. ' +
            'Then, adds each `item` at that position in `array`. Returns the removed items. ' +
            'If used with `{get}` this will modify the original array')
        .withExample(
            '{set;~array;["this", "is", "an", "array"]} {splice;{get;~array};1;1;was} {get;~array}',
            '["is"] {"v":["this","was","an","array"],"n":"~array"}'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenDefault(async function (params) {
            let arr = bu.deserializeTagArray(params.args[1]),
                start = parseInt(params.args[2]),
                delCount = parseInt(params.args[3] || 0),
                insert = params.args.slice(4),
                fallback = parseInt(params.fallback);

            if (arr == null || !Array.isArray(arr.v))
                return await Builder.errors.notAnArray(params);

            if (isNaN(start)) start = fallback;
            if (isNaN(delCount)) delCount = fallback;
            if (isNaN(start) || isNaN(delCount))
                return await Builder.errors.notANumber(params);

            for (let i = 0; i < insert.length; i++) {
                let arr = bu.deserializeTagArray(insert[i]);
                if (arr == null || !Array.isArray(arr.v))
                    continue;
                insert.splice(i, 1, ...arr.v);
                i += arr.v.length - 1;
            }

            let result = arr.v.splice(start, delCount, ...insert);
            if (arr.n)
                await bu.setArray(arr, params);

            return bu.serializeTagArray(result);
        })
        .build();