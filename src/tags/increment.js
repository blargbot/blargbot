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
    .withArgs(a => [a.require('varName'), a.optional('amount'), a.optional('floor')])
    .withDesc('Increases `varName`\'s value by `amount`. '+
    '`floor` is a boolean, and if it is `true` then the value will be rounded down. ' +
    '`amount` defaults to 1. `floor` defaults to `true`')
    .withExample(
      '{set;~counter;0} {repeat;{increment;~counter},;10}',
      '1,2,3,4,5,6,7,8,9,10'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-4', async function (params) {
      let argName = params.args[1],
        increment = 1,
        floor = true;

      if (params.args.length > 2)
        increment = parseFloat(params.args[2]);

      if (params.args.length > 3) {
        floor = bu.parseBoolean(params.args[3]);
        if (!bu.isBoolean(floor))
          return await Builder.errors.notABoolean(params);
      }

      if (isNaN(increment))
        return await Builder.errors.notANumber(params);

      let value = parseFloat(await TagManager.list['get'].getVar(params, argName));
      if (isNaN(value))
        return await Builder.errors.notANumber(params);

      if (floor) value = Math.floor(value), increment = Math.floor(increment);

      value += increment;
      await TagManager.list['set'].setVar(params, argName, value);

      return value;
    }).whenDefault(Builder.errors.tooManyArguments)
    .build();