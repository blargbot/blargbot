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
        .withArgs(a => a.required('embed'))
        .withDesc('Takes whatever input you pass to `embed` and attempts to form an embed from it. `embed` must be a valid json embed object.\n' +
            'This subtag works well with `{embedbuild}`. If attempting to use inside of a `{send}`, `{edit}` or `{dm}`, you should not include `{embed}`, ' +
            'and instead just pass the content direct to `{send}`/`{edit}`/`{dm}`\n' +
            'You can find information about embeds [here (embed structure)](https://discordapp.com/developers/docs/resources/channel#embed-object) ' +
            'and [here (embed limits)](https://discordapp.com/developers/docs/resources/channel#embed-limits) as well as a useful tool for testing embeds ' +
            '[here](https://leovoel.github.io/embed-visualizer/)')
        .withExample(
            '{embed;{lb}"title":"Hello!"{rb}}',
            '(an embed with "Hello!" as the title)'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            context.state.embed = bu.parseEmbed(args[0]);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();