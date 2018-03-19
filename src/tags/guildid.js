/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:09
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:47:09
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('guildid')
        .withDesc('Returns the id of the current guild.')
        .withExample(
            'The guild\'s id is {guildid}',
            'The guild\'s id is 1234567890123456'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', async function (params) {
            return params.msg.channel.guild.id;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();