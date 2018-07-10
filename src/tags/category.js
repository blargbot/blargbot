/*
 * @Author: zoomah
 * @Date: 2018-07-10 7:08:15
 * @Last Modified by: zoomah
 * @Last Modified time: 2018-07-10 7:08:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('category')
        .withArgs(a => [a.optional('channelid'), a.optional('quiet')])
        .withDesc('Returns the category of the given channel. If no channelid is given, the current channels category will be returned.')
        .withExample(
            'This channel\'s category is "{category}"',
            'This channel\'s category is "some fancy category"'
        )
        .whenArgs(0, async (_, context) => (context.channel.parentID || ''))
        .whenArgs('1-2', async (subtag, context, args) => {
            let ch = bu.parseChannel(args[0], true);
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1]
            return ch ? (ch.parentID || '') : quiet ? '' : Builder.errors.noChannelFound(subtag, context);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
