/*
 * @Author: zoomah
 * @Date: 2018-07-10 7:08:15
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-13 14:59:41
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('channelcategory')
        .withAlias('category')
        .withArgs(a => [a.optional('channelid'), a.optional('quiet')])
        .withDesc('Returns the category id of the given channel. If no channelid is given, the current channels category id will be returned.')
        .withExample(
            'This channel\'s category is "{category}"',
            'This channel\'s category is "111111111111111"'
        )
        .whenArgs(0, async (_, context) => (context.channel.parentID || ''))
        .whenArgs('1-2', async (subtag, context, args) => {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1];
            let channel = await Builder.util.parseChannel(context, args[0], { quiet });

            if (!channel)
                return quiet ? '' : Builder.errors.noChannelFound(subtag, context);

            return channel.parentID || '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
