/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:00
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:51:00
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('prefix')
        .withDesc('Gets the current guild\'s prefix.')
        .withExample(
            'Your prefix is {prefix}',
            'Your prefix is b!'
        )
        .whenArgs('0', async (_, context) => await bu.guildSettings.get(context.guild.id, 'prefix') || config.discord.defaultPrefix)
        .whenDefault(Builder.errors.tooManyArguments)
        .build();