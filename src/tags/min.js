/*
 * @Author: stupid cat
 * @Date: 2017-05-21 13:17:14
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 13:25:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('min')
        .acceptsArrays()
        .withArgs(a => a.require('number', true))
        .withDesc('Returns the smallest entry out of `numbers`. If an array is provided, it will be expanded to its individual values.')
        .withExample(
            '{min;50;2;65}',
            '2'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            args = Builder.util.flattenArgArrays(args);
            args = args.map(bu.parseFloat);

            if (args.filter(isNaN).length > 0)
                return NaN;

            return Math.min(...args);
        })
        .build();