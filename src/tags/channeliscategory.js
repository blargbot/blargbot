/*
 * @Author: zoomah
 * @Date: 2018-07-10 7:08:15
 * @Last Modified by: zoomah
 * @Last Modified time: 2018-07-10 12:46:444
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('channeliscategory')
        .withAlias('iscategory')
        .withArgs(a => [a.require('channelId'), a.optional('quiet')])
        .withDesc('Checks if `channelId` is a category. `channelId` defaults to the current channel')
        .withExample(
            '{if;{iscategory,123456789};yup;nope}',
            'nope'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1];
            let channel = await Builder.util.parseChannel(context, args[0], quiet);

            if (typeof channel === 'function') 
                return quiet ? false : channel(subtag, context);
            return channel.type == 4;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
