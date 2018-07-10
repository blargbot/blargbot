/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:28
 * @Last Modified by: zoomah
 * @Last Modified time: 2018-07-10 7:08:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('channelpos')
        .withAlias('categorypos')
        .withArgs(a => [a.optional('channelid'), a.optional('quiet')])
        .withDesc('Returns the position of the current channel. If no channelid is given, the current channels position will be returned.')
        .withExample(
            'This channel is in position {channelpos}',
            'This channel is in position 1'
        )
        .whenArgs(0, async (_, context) => context.channel.position)
        .whenArgs('1-2', async (subtag, context, args) => {
            let ch = context.channels.find(c => c.id == bu.parseChannel(args[0], true));
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1]
            return ch ? ch.position : quiet ? '' : Builder.errors.noChannelFound(subtag, context);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
