/*
 * @Author: stupid cat
 * @Date: 2017-05-21 13:17:14
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 13:26:19
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('max')
    .usesArrays()
    .withArgs(a => a.require('number', true))
    .withDesc('Returns the largest number out of those provided.')
    .withExample(
      '{max;50;2;65}',
      '65'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.util.notEnoughArguments)
    .whenDefault(async function(params) {
      let args = await Builder.util.flattenArgArrays(params.args.slice(1));
      args = args.map(parseFloat);

      if (args.filter(isNaN).length > 0)
        return await Builder.util.notANumber(params);

      return Math.max(...args);
    })
    .build();