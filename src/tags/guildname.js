/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:21
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:47:21
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('guildname')
        .withDesc('Returns the name of the current guild.')
        .withExample(
            'This guild\'s name is {guildname}.',
            'This guild\'s name is TestGuild.'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', async function (params) {
            return params.msg.channel.guild.name;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();