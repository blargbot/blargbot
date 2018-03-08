/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:29
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:25:29
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('abs')
        .acceptsArrays()
        .withArgs(a => a.require('number', true))
        .withDesc('Gets the absolute value of `number`. If multiple are supplied, then an array will be returned')
        .withExample(
            '{abs;-535}',
            '535'
        )
        .beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenDefault(async function (params) {
            let values = Builder.util.flattenArgArrays(params.args.slice(1)).map(parseFloat);
            if (values.filter(isNaN).length > 0)
                return await Builder.errors.notANumber(params);
            values = values.map(Math.abs);
            if (values.length == 1)
                return values[0];
            return bu.serializeTagArray(values);
        })
        .build();