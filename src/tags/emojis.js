/*
 * @Author: zoomah
 * @Date: 2018-07-10 7:08:15
 * @Last Modified by: HunteRoi
 * @Last Modified time: 2018-07-19 18:30:00
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('emojis')
        .withArgs(a => [a.optionnal('quiet')])
        .withDesc('Returns an array of emoji IDs of the current guild.' +
            'If `quiet` is specified, if an emoji is restricted to at least one role, then the emoji simply get ignored.'
        )
        .withExample(
            'This guild has {length;{emojis}} emojis.',
            'This guild has 23 emojis.'
        )
        .whenArgs(0, async (subtag, context, args) => {
            let botRoles = context.guild.members.get(bot.user.id).roles.map(r => r.id);
            let emojis = context.guild.emojis.map(e => {
                if (botRoles.some(r => e.roles.includes(r))) `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`;
            });
            return JSON.stringify(emojis);
        })
        .whenArgs(1, async (subtag, context, args) => {
            let emojis = context.guild.emojis.map(e => {
                if (e.roles === undefined) `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`;
            });
            return JSON.stringify(emojis);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
