/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:37
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('color')
    .withDesc('Attempts to convert `color` to a hex code. `color` can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number.')
    .withExample(
      'This command is {commandname}',
      'This command is test'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2', async function(params) {
      let color = bu.parseColor(params.args[1]);
      if (color == null)
        return await Builder.util.error(params, 'Invalid color');
      return color.toString(16);
     })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();