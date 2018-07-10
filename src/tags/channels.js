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
    Builder.APITag('channels')
        .withArgs(a => [a.optional('categoryid')], a => [a.optional('quiet')])
        .withDesc('Returns an array of channel IDs on the current guild or within a given category.')
        .withExample(
            'This guild has {length;{channels}} channels.',
            'This guild has 23 channels.'
        )
        .whenArgs(0, async (_, context) => JSON.stringify(context.guild.channels.map(c => c.id)))
        .whenArgs('1-2', async (_, context, args) => {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1]
            let ch == bu.parseChannel(args[0], true);
            return (ch && ch.channels) ? JSON.stringify(ch.channels.map(c => c.id)) : quiet ? '' : '`Category not found`';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
