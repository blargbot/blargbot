/*
 * @Author: stupid cat
 * @Date: 2017-05-21 13:17:14
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 13:25:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('min')
    .withArgs(a => a.require('number', true))
    .withDesc('Returns the smallest number out of those provided.')
    .withExample(
      '{min;50;2;65}',
      '2'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.util.notEnoughArguments)
    .whenDefault(async function(params) {
      let args = await Builder.util.flattenArgArrays(params.args.slice(1));
      args = args.map(parseFloat);

      if (args.filter(isNaN).length > 0)
        return await Builder.util.notANumber(params);

      return Math.min(...args);
    })
    .build();