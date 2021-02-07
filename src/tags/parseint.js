/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:51
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:51
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('parseint')
        .withArgs(a => a.required('text'))
        .withDesc('Returns an integer from `text`. If it wasn\'t a number, returns `NaN`.')
        .withExample(
            '{parseint;abcd} {parseint;1234} {parseint;12cd}',
            'NaN 1234 12'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            let number = bu.parseInt(args[0]);
            if (isNaN(number))
                return 'NaN';
            return number;
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();