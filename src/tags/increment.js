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
    .withArgs(a => [a.require('variable'), a.optional('amount')])
    .withDesc('Increases the value of the specified variable by the specified amount. Defaults to 1')
    .withExample(
      '{set;counter;0} {repeat;{increment;counter},;10}',
      '1,2,3,4,5,6,7,8,9,10'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-3', async function(params) {
      let argName = params.args[1],
        increment = 1;

      if (params.args.length === 3)
        increment = parseInt(params.args[2]);

      if (isNaN(increment))
        return await Builder.errors.notANumber(params);

      let value = parseFloat(await TagManager.list['get'].getVar(params, argName));
      if (isNaN(value))
        return await Builder.errors.notANumber(params);

      value += increment;
      await TagManager.list['set'].setVar(params, argName, value);

      return value;
    }).whenDefault(Builder.errors.tooManyArguments)
    .build();