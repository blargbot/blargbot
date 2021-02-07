/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:59
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:47:59
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('increment')
        .withArgs(a => [a.required('varName'), a.optional('amount'), a.optional('floor')])
        .withDesc('Increases `varName`\'s value by `amount`. ' +
            '`floor` is a boolean, and if it is `true` then the value will be rounded down. ' +
            '`amount` defaults to 1. `floor` defaults to `true`')
        .withExample(
            '{set;~counter;0} {repeat;{increment;~counter},;10}',
            '1,2,3,4,5,6,7,8,9,10'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-3', async function (subtag, context, args) {
            return this.runIncrement(subtag, context, args, 1);
        }).whenDefault(Builder.errors.tooManyArguments)
        .withProp('runIncrement', async function (subtag, context, args, modifier) {
            let amount = 1, floor = true;

            if (args[1]) amount = bu.parseFloat(args[1]);

            if (args[2]) {
                floor = bu.parseBoolean(args[2]);
                if (!bu.isBoolean(floor))
                    return Builder.errors.notABoolean(subtag, context);
            }

            if (isNaN(amount))
                return Builder.errors.notANumber(subtag, context);

            let value = bu.parseFloat(await context.variables.get(args[0]));
            if (isNaN(value))
                return Builder.errors.notANumber(subtag, context);

            if (floor) value = Math.floor(value), amount = Math.floor(amount);

            value += amount * modifier;
            await context.variables.set(args[0], value.toString());

            return value;
        })
        .build();