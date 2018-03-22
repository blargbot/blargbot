/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('isnsfw')
        .withArgs(a => a.optional('channelId'))
        .withDesc('Checks if `channelId` is a NSFW channel. `channelId` defaults to the current channel')
        .withExample(
            '{if;{isnsfw};Spooky nsfw stuff;fluffy bunnies}',
            'fluffy bunnies'
        )
        .whenArgs('0-1', async function (subtag, context, args) {
            let channel = context.channel;
            if (args[0])
                channel = bu.parseChannel(args[0], true);

            if (channel == null) return Builder.errors.noChannelFound(subtag, context);

            return await bu.isNsfwChannel(channel.id);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();