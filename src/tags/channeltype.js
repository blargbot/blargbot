/*
 * @Author: zoomah
 * @Date: 2018-07-10 7:08:15
 * @Last Modified by: zoomah
 * @Last Modified time: 2018-07-10 7:08:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

const types = ['text','dm','voice','group-dm','category'];

module.exports =
    Builder.APITag('channeltype')
        .withArgs(a => [a.optional('channelid'), a.optional('quiet')])
        .withDesc('Returns the type of a given channel. If no channelid is given, the current channels type will be returned.\n'
                 +'Possible results: '+types.map(t => '`'+t+'`').join(', '))
        .withExample(
            'This channel is {channeltype} channel',
            'This channel is text channel'
        )
        .whenArgs(0, async (_, context) => types[context.channel.type])
        .whenArgs('1-2', async (_, context, args) => {
            let ch = context.channels.find(c => c.id == bu.parseChannel(args[0], true));
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1]
            return ch ? types[ch.type] : quiet ? '' : Builder.errors.noChannelFound(subtag, context);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
