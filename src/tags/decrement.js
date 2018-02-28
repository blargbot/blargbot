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
    .withArgs(a => [a.require('variable'), a.optional('amount')])
    .withDesc('Decreases the value of the specified variable by the specified amount. Defaults to 1')
    .withExample(
      '{set;counter;0} {repeat;{decrement;counter},;10}',
      '-1,-2,-3,-4,-5,-6,-7,-8,-9,-10'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-3', async function(params) {
      let argName = params.args[1],
        decrement = 1;

      if (params.args.length === 3)
        decrement = parseInt(params.args[2]);

      if (isNaN(decrement))
        return await Builder.errors.notANumber(params);

      let value = parseFloat(await TagManager.list['get'].getVar(params, argName));
      if (isNaN(value))
        return await Builder.errors.notANumber(params);

      value -= decrement;
      await TagManager.list['set'].setVar(params, argName, value);

      return value;
    }).whenDefault(Builder.errors.tooManyArguments)
    .build();