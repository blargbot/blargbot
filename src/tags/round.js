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
  Builder.ComplexTag('round')
    .withArgs(a => a.require('number'))
    .withDesc('Rounds a number up or down.')
    .withExample(
      '{round;1.23}',
      '1'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2', async function(params) {
      let number = parseFloat(params.args[1]);
      if (isNaN(number))
        return await Builder.errors.notANumber(params);
      return Math.round(number);
    }).whenDefault(Builder.errors.tooManyArguments)
    .build();