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
  Builder.ComplexTag('parseint')
    .withArgs(a => a.require('text'))
    .withDesc('Returns an integer from text. If it wasn\'t a number, returns NaN.')
    .withExample(
      '{parseint;abcd} {parseint;1234} {parseint;12cd}',
      'NaN 1234 12'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.util.notEnoughArguments)
    .whenArgs('2', async params => {
      let number = parseInt(params.args[1]);
      if (isNaN(number))
        return 'NaN';
      return number;
    }).whenDefault(Builder.util.tooManyArguments)
    .build();