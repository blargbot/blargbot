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
    .acceptsArrays()
    .withArgs(a => a.require('numbers', true))
    .withDesc('Returns the largest entry out of `numbers`. If an array is provided, it will be expanded to its individual values')
    .withExample(
      '{max;50;2;65}',
      '65'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenDefault(async function(params) {
      let args = await Builder.util.flattenArgArrays(params.args.slice(1));
      args = args.map(parseFloat);

      if (args.filter(isNaN).length > 0)
        return await Builder.errors.notANumber(params);

      return Math.max(...args);
    })
    .build();