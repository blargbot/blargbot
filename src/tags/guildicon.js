/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:06
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:47:06
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('guildicon')
        .withDesc('Returns the icon of the current guild.')
        .withExample(
            'The guild\'s icon is {guildicon}',
            'The guild\'s icon is (icon url)'
        )
        .whenArgs('0', async (_, context) => `https://cdn.discordapp.com/icons/${context.guild.id}/${context.guild.icon}.jpg`)
        .whenDefault(Builder.errors.tooManyArguments)
        .build();