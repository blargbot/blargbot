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
  Builder.ComplexTag('floor')
    .withArgs(b => b.require('number'))
    .withDesc('Rounds a number down.')
    .withExample(
      '{floor;1.23}',
      '1'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.util.notEnoughArguments)
    .whenArgs('2', async params => {
      let number = parseFloat(params.args[1]);
      if (isNaN(number))
        return await Builder.errors.notANumber(params);
      return Math.floor(number);
    }).whenDefault(Builder.util.tooManyArguments)
    .build();