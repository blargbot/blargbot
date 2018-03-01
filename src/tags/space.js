/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:48
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:57:48
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('space')
  .withArgs(a => a.optional('count'))
    .withDesc('Will be replaced by a specified number of spaces (Default to 1).')
    .withExample(
      '{space;4}Hello, world!',
      '    Hello, world!'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-2', async function (params) {
        let count = parseInt(params.args[1] || '1'),
        fallback = parseInt(params.fallback);

        if (isNaN(count)) count = fallback;
        if (isNaN(count)) return Builder.errors.notANumber(params);

        if (count < 0) count = 0;

        return new Array(count).join(' ');
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();