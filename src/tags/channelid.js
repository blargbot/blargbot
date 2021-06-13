/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:08
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-13 15:00:32
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */


const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('channelid')
        .withAlias('categoryid')
        .withArgs(a => [a.optional('channelname'), a.optional('quiet')])
        .withDesc('Returns the ID of the given channelname. If no channelname is given, it uses the current channel.')
        .withExample(
            'This channel\'s id is {channelid}',
            'This channel\'s id is 1234567890123456'
        )
        .whenArgs(0, async (_, context) => context.channel.id)
        .whenArgs('1-2', async (subtag, context, args) => {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1];
            let channel = await Builder.util.parseChannel(context, args[0], {quiet});
            if (!channel)
                return quiet ? '' : Builder.errors.noChannelFound(subtag, context);

            return channel.id;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
