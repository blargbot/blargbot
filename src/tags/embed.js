/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-05 17:19:13
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('embed')
    .withArgs(a => a.require('embed'))
    .withDesc('Takes whatever input you pass to `embed` and attempts to form an embed from it. `embed` must be a valid json embed object. '+
      'You can find a helpful tool for designing embeds [here](https://leovoel.github.io/embed-visualizer/)')
    .withExample(
      '{embed;{lb}"title":"Hello!"{rb}}',
      '(an embed with "Hello!" as the title)'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2', async function (params) {
      let embed = bu.processSpecial(params.args[1], true);
      try {
        embed = JSON.parse(embed);
      } catch (err) {
        embed = {
          fields: [{ name: 'Malformed JSON', value: params.args[1]}]
        };
      }

      return {
        embed
      };
    }).whenDefault(Builder.errors.tooManyArguments)
    .build();