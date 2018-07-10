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
    Builder.AutoTag('istext')
        .withArgs(a => [a.optional('channelId'), a.optional('quiet')])
        .withDesc('Checks if `channelId` is a text channel. `channelId` defaults to the current channel')
        .withExample(
            '{if;{istext,123456789};yup;nope}',
            'nope'
        )
        .whenArgs('0-2', async function (subtag, context, args) {
            let channel = context.channel;
            if (args[0])
                channel = context.channels.find(c => c.id == bu.parseChannel(args[0], true));

            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1]
            
            if (channel == null) return quiet ? '' : Builder.errors.noChannelFound(subtag, context);

            return channel.type == 0;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
