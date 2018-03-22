/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:51
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:51
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('decrement')
        .withArgs(a => [a.require('varName'), a.optional('amount'), a.optional('floor')])
        .withDesc('Decreases `varName`\'s value by `amount`. ' +
            '`floor` is a boolean, and if it is `true` then the value will be rounded down. ' +
            '`amount` defaults to 1. `floor` defaults to `true`')
        .withExample(
            '{set;~counter;0} {repeat;{decrement;~counter},;10}',
            '-1,-2,-3,-4,-5,-6,-7,-8,-9,-10'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-3', async function (subtag, context, args) {
            return await TagManager.list['increment'].runIncrement(subtag, context, args, -1);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();