/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:41
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:37:41
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('rounddown')
        .withAlias('floor')
        .withArgs(a => a.required('number'))
        .withDesc('Rounds `number` down.')
        .withExample(
            '{rounddown;1.23}',
            '1'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            let number = bu.parseFloat(args[0]);
            if (isNaN(number))
                return Builder.errors.notANumber(subtag, context);
            return Math.floor(number);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();
