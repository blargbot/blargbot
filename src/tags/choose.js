/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:33
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:33
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('choose')
    .withArgs(a => [a.require('choice'), a.require('option', true)])
    .withDesc('Chooses from the given options, where `choice` is the index of the option selected.')
    .withExample(
      'I feel like eating {choose;1;cake;pie;pudding} today.',
      'I feel like eating pie today.'
    ).whenArgs('<3', Builder.errors.notEnoughArguments)
    .whenDefault(async function(params) {
      params.args[1] = await bu.processTagInner(params, 1);
      let index = parseInt(params.args[1]);

      if (isNaN(index))
        return await Builder.errors.notANumber(params);

      if (index < 0)
        return await Builder.util.error(params, 'Choice cannot be negative');

      params.content = params.args[index + 2];
      return await bu.processTagInner(params);
    })
    .build();