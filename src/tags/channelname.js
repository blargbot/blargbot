/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:19
 * @Last Modified by: zoomah
 * @Last Modified time: 2018-07-10 7:08:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('channelname')
        .withArgs(a => [a.optional('channelid'), a.optional('quiet')])
        .withAlias('categoryname')
        .withDesc('Returns the name of the given channel. If no channelid is given, the current channels name will be returned.')
        .withExample(
            'This channel\'s name is {channelname}',
            'This channel\'s name is test-channel'
        )
        .whenArgs(0, async (_, context) => context.channel.name)
        .whenArgs('1-2', async (subtag, context, args) => {
            let ch = context.channels.find(c => c.id == bu.parseChannel(args[0], true));
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1]
            return ch ? ch.name : quiet ? '' : Builder.errors.noChannelFound(subtag, context);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
