/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:21
 * @Last Modified by: zoomah
 * @Last Modified time: 2018-05-13 8:00:21
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('execcc')
        .withArgs(a => [a.require('ccommand'), a.optional('args', true)])
        .withDesc('Executes `ccommand` using `args` as the input. Useful for modules.')
        .withExample(
            'Let me do a ccommand for you. {execcc;f}',
            'Let me do a ccommand for you. User#1111 has paid their respects. Total respects given: 5'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let storedGuild = await bu.getGuild(context.guild.id),
                ccommand = storedGuild.ccommands[args[0].toLowerCase()];

            if (ccommand == null)
                return Builder.util.error(subtag, context, 'CCommand not found: ' + args[0]);
            
            if (args.length == 1) 
                return TagManager.list['exec'].execTag(subtag, context, ccommand.content, '');

            if (args.length == 2) 
                return TagManager.list['exec'].execTag(subtag, context, ccommand.content, args[1]);

            let a = Builder.util.flattenArgArrays(args.slice(1));
            return TagManager.list['exec'].execTag(subtag, context, ccommand.content, '"'+a.join('" "')+'"');
        })
        .build();