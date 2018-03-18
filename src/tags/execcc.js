/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:21
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:37:21
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('execcc')
        .withArgs(a => [a.require('ccommand'), a.optional('args')])
        .withDesc('Executes `ccommand` using `args` as the input. Useful for modules.')
        .withExample(
            'Let me do a ccommand for you. {execcc;f}',
            'Let me do a ccommand for you. User#1111 has paid their respects. Total respects given: 5'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (params) {
            let storedGuild = await bu.getGuild(params.msg.guild.id);
            let tag = storedGuild.ccommands[params.args[1].toLowerCase()];
            return TagManager.list['exec'].execTag(params, tag, params.args[1], 'CCommand');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();