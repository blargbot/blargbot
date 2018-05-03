/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:29:48
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:29:48
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('roundup')
        .withAlias('ceil')
        .withArgs(a => a.require('number'))
        .withDesc('Rounds `number` up.')
        .withExample(
            '{roundup;1.23}',
            '2'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            let number = bu.parseFloat(args[0]);
            if (isNaN(number))
                return Builder.errors.notANumber(subtag, context);
            return Math.ceil(number);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();