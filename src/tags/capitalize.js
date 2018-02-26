/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:46
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:27:46
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.ComplexTag('capitalize')
    .withArgs(b =>
      b.require('text').optional('lower')
    ).withDesc('Capitalizes the first letter of `text`. If `lower` is specified the rest of the text will be lowercase')
    .withExample(
      '{capitalize;hello world!}',
      'Hello world!'
    ).beforeExecute(Builder.defaults.processAllSubtags)
    .whenArgs('1', Builder.defaults.notEnoughArguments)
    .whenArgs('2-3', async params => {
      if (params.args[2])
        return params.args[1][0].toUpperCase() + params.args[1].substr(1).toLowerCase();
      return params.args[1][0].toUpperCase() + params.args[1].substr(1);
    }).whenDefault(Builder.defaults.tooManyArguments)
    .build()
