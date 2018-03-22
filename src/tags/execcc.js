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
        )
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            let storedGuild = await bu.getGuild(context.guild.id),
                tag = storedGuild.ccommands[args[0].toLowerCase()];

            if (tag == null)
                return Builder.util.error(subtag, context, 'CCommand not found: ' + args[0]);

            return TagManager.list['exec'].execTag(subtag, context, tag.content, args[1] || '');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();