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
  Builder.ComplexTag('ceil')
    .withArgs(b => b.require('number'))
    .withDesc('Rounds a number up.')
    .withExample(
      '{ceil;1.23}',
      '2'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2', async params => {
      let number = parseFloat(params.args[1]);
      if (isNaN(number))
        return await Builder.errors.notANumber(params);
      return Math.ceil(number);
    }).whenDefault(Builder.errors.tooManyArguments)
    .build();