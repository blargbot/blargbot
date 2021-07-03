/*
 * @Author: zoomah
 * @Date: 2018-07-10 7:08:15
 * @Last Modified by: HunteRoi
 * @Last Modified time: 2018-07-19 23:13:10
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('emojis')
        .withArgs(a => [a.optional('roleid')])
        .withDesc('Returns an array of emoji IDs of the current guild.' +
            'If `roleid` is specified, returns all the emojis whitelisted for the provided role.\n'+
            'Please note that Discord will remove all the emojis from a message which contains an emoji that blargbot can\'t use. '+
            'For example, blargbot can\'t use a role-restricted emoji if it doesn\'t have the role. Learn more [here](https://discordapp.com/developers/docs/resources/emoji).'
        )
        .withExample(
            'This guild has {length;{emojis}} emojis.',
            'This guild has 23 emojis.'
        )
        .whenArgs(0, async (subtag, context, args) => {
            let emojis = context.guild.emojis.map(e => `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`);
            return JSON.stringify(emojis);
        })
        .whenArgs(1, async (subtag, context, args) => {
            let emojis = context.guild.emojis.filter(e => e.roles !== undefined && e.roles.find(r => r.id === args[1]))
                .map(e => `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`);
            return JSON.stringify(emojis);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
