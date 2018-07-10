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
    Builder.AutoTag('isvoice')
        .withArgs(a => [a.optional('channelId'), a.optional('quiet')])
        .withDesc('Checks if `channelId` is a voice channel. `channelId` defaults to the current channel')
        .withExample(
            '{if;{istext,123456789};yup;nope}',
            'nope'
        )
        .whenArgs('0-2', async function (subtag, context, args) {
            let ch = context.channel;
            if (args[0]) ch = Builder.parseChannel(context, args[0]);

            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1]
            if (typeof ch === 'function') return quiet ? false : ch(subtag, context);

            return ch.type == 2;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
