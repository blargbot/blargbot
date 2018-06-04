/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:21
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-04 10:18:59
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
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            let storedGuild = await bu.getGuild(context.guild.id),
                ccommand = storedGuild.ccommands[args[0].toLowerCase()];

            if (ccommand == null)
                return Builder.util.error(subtag, context, 'CCommand not found: ' + args[0]);
            if (ccommand.alias)
                return Builder.util.error(subtag, context, 'Cannot execcc imported tag: ' + args[0]);

            let name = args[0].toLowerCase();
            let cd = context._cooldowns[context.msg.guild.id][true][context.msg.author.id];
            if (cd) {
                let cdDate = cd[name] + (ccommand.cooldown || 500);
                let diff = Date.now() - cdDate;
                if (diff < 0) {
                    let f = Math.floor(diff / 100) / 10;
                    return Builder.util.error(subtag, context, 'Cooldown: ' + diff);
                }
            }
            cd[name] = Date.now();

            return TagManager.list['exec'].execTag(subtag, context, ccommand.content, args[1] || '');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();