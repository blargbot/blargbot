/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:08
 * @Last Modified by: zoomah
 * @Last Modified time: 2018-07-10 7:08:15
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
            let ch = context.guild.channels.find(c => c.name.toLowerCase() == args[0].toLowerCase());
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1]
            return ch ? ch.id : quiet ? '' : Builder.errors.noChannelFound(subtag, context);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
