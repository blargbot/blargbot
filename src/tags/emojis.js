/*
 * @Author: zoomah
 * @Date: 2018-07-10 7:08:15
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-07-18 12:25:40
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('emojis')
        .withDesc('Returns an array of channel IDs on the current guild or within a given category.')
        .withExample(
        'This guild has {length;{emojis}} emojis.',
        'This guild has 23 emojis.'
        )
        .whenArgs(0, async (subtag, context, args) => {
            let emojis = context.guild.emojis.map(e => `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`);
            return JSON.stringify(emojis);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
