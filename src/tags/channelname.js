/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:19
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-19 17:50:00
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('channelname')
        .withAlias('categoryname')
        .withArgs(a => [a.optional('channelid'), a.optional('quiet')])
        .withDesc('Returns the name of the given channel. If no channelid is given, the current channels name will be returned.')
        .withExample(
            'This channel\'s name is {channelname}',
            'This channel\'s name is test-channel'
        )
        .whenArgs(0, async (_, context) => context.channel.name)
        .whenArgs('1-2', async (subtag, context, args) => {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1];
            let channel = await Builder.util.parseChannel(context, args[0], { quiet, suppress: context.scope.suppressLookup });
            if (!channel)
                return quiet ? '' : Builder.errors.noChannelFound(subtag, context);

            return channel.name;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
