/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:15
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-04-27 13:14:24
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('channels')
        .withArgs(a => [a.optional('categoryid')], a => [a.optional('quiet')])
        .withDesc('Returns an array of channel IDs of the channels on the current guild.')
        .withExample(
            'This guild has {length;{guildchannels}} channels.',
            'This guild has 123 channels.'
        )
        .whenArgs(0, async (_, context) => JSON.stringify(context.guild.channels.map(c => c.id)))
        .whenArgs('1-2', async (_, context, args) => {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1]
            let ch == context.guild.channels.find(c => c.id == args[0]);
            return (ch && ch.channels) ? JSON.stringify(ch.channels.map(c => c.id)) : quiet ? '' : '`Category not found`';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
