/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:28
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:28
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

const types = ['text','dm','voice','group-dm','category'];

module.exports =
    Builder.APITag('channeltype')
        .withArgs(a => [a.optional('channelid')], a => [a.optional('quiet')])
        .withDesc('Returns the type of a given channel. If no channelid is given, the current channels type will be returned.\n'
                 +'Possible results: `'+types.join(', ')+'`')
        .withExample(
            'This channel is {channeltype} channel',
            'This channel is text channel'
        )
        .whenArgs(0, async (_, context) => types[context.channel.type])
        .whenArgs('1-2', async (_, context, args) => {
            let ch = context.guild.channels.find(c => c.id == args[0]);
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1]
            return ch ? types[ch.type] : quiet ? '' : '`Channel not found`';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
