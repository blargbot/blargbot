/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:19
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:19
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('category')
        .withArgs(a => [a.optional('channelid')], a => [a.optional('quiet')])
        .withDesc('Returns the category of the given channel. If no channelid is given, the current channels category will be returned.')
        .withExample(
            'This channel\'s category is "{category}"',
            'This channel\'s category is "some fancy category"'
        )
        .whenArgs(0, async (_, context) => (context.channel.parentID || ''))
        .whenArgs('1-2', async (_, context, args) => {
            let ch = bu.parseChannel(args[0], true);
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1]
            return ch ? (ch.parentID || '') : quiet ? '' : '`Channel not found`';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
