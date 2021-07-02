/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:56:30
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:56:51
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('round')
        .withArgs(a => a.required('number'))
        .withDesc('Rounds `number` to the nearest whole number.')
        .withExample(
            '{round;1.23}',
            '1'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            let number = bu.parseFloat(args[0]);
            if (isNaN(number))
                return Builder.errors.notANumber(subtag, context);
            return Math.round(number);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();