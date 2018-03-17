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
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2-4', async function (params) {
            let argName = params.args[1],
                decrement = 1,
                floor = true;

            if (params.args[2])
                decrement = bu.parseFloat(params.args[2]);

            if (params.args[3]) {
                floor = bu.parseBoolean(params.args[3]);
                if (!bu.isBoolean(floor))
                    return await Builder.errors.notABoolean(params);
            }

            if (isNaN(decrement))
                return await Builder.errors.notANumber(params);

            let value = bu.parseFloat(await TagManager.list['get'].getVar(params, argName));
            if (isNaN(value))
                return await Builder.errors.notANumber(params);

            if (floor) value = Math.floor(value), decrement = Math.floor(decrement);

            value -= decrement;
            await TagManager.list['set'].setVar(params, argName, value);

            return value;
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();