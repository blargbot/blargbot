/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:21
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-05-11 18:54:06
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.BotTag('execcc')
        .withArgs(a => [a.require('ccommand'), a.optional('args')])
        .withDesc('Executes `ccommand` using `args` as the input. Useful for modules.')
        .withExample(
            'Let me do a ccommand for you. {execcc;f}',
            'Let me do a ccommand for you. User#1111 has paid their respects. Total respects given: 5'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let ccommand = await context.getCached(args[0].toLowerCase(),
                async key => (await bu.getGuild(context.guild.id)).ccommands[key]);

            if (ccommand == null)
                return Builder.util.error(subtag, context, 'CCommand not found: ' + args[0]);
            if (ccommand.alias)
                return Builder.util.error(subtag, context, 'Cannot execcc imported tag: ' + args[0]);

            let name = args[0].toLowerCase();
            if (!context._cooldowns[context.msg.guild.id][true])
                context._cooldowns[context.msg.guild.id][true] = {};
            if (!context._cooldowns[context.msg.guild.id][true][context.msg.author.id])
                context._cooldowns[context.msg.guild.id][true][context.msg.author.id] = {};
            let cd = context._cooldowns[context.msg.guild.id][true][context.msg.author.id];
            if (cd) {
                let cdDate = cd[name] + (ccommand.cooldown || 0);
                let diff = Date.now() - cdDate;
                if (diff < 0) {
                    let f = Math.floor(diff / 100) / 10;
                    return Builder.util.error(subtag, context, 'Cooldown: ' + (diff * -1));
                }
            }
            cd[name] = Date.now();
            switch (args.length) {
                case 1:
                    return TagManager.list['exec'].execTag(subtag, context, ccommand.content, '');
                case 2:
                    return TagManager.list['exec'].execTag(subtag, context, ccommand.content, args[1], ccommand.flags);
                default:
                    let a = Builder.util.flattenArgArrays(args.slice(1));
                    return TagManager.list['exec'].execTag(subtag, context, ccommand.content, '"' + a.join('" "') + '"', ccommand.flags);
            }
            // ! This line can be removed as the 'default' case already returns
            return TagManager.list['exec'].execTag(subtag, context, ccommand.content, args[1] || '');
        })
        .build();
