/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:31:02
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-03-29 17:29:16
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('delete')
        .withArgs(a => a.optional([a.optional('channelId'), a.require('messageId')]))
        .withDesc('Deletes the specified `messageId` from `channelId`, defaulting to the message that invoked the command. ' +
            'If `channelId` is not provided, it defaults to the current channel. ' +
            'Only ccommands can delete other messages.')
        .withExample(
            'The message that triggered this will be deleted. {delete}',
            '(the message got deleted idk how to do examples for this)'
        )
        .whenArgs(0, async function (subtag, context, args) { return await this.deleteMessage(subtag, context, context.channel.id, context.msg.id); })
        .whenArgs(1, async function (subtag, context, args) { return await this.deleteMessage(subtag, context, context.channel.id, args[0]); })
        .whenArgs(2, async function (subtag, context, args) { return await this.deleteMessage(subtag, context, args[0], args[1]); })
        .whenDefault(Builder.errors.tooManyArguments)
        .withProp('deleteMessage', async function (subtag, context, channelId, messageId) {
            if (!(await context.isStaff || context.ownsMessage(messageId)))
                return Builder.util.error(subtag, context, 'Author must be staff to delete unrelated messages');

            let msg = context.msg,
                channel = Builder.util.parseChannel(context, channelId);

            if (typeof channel === 'function') //One of the Builder.error values got returned
                return channel(subtag, context);

            if (msg.id !== messageId)
                try {
                    msg = await bot.getMessage(channel.id, messageId);
                } catch (err) {
                    return Builder.errors.noMessageFound(subtag, context);
                }

            if (!bu.notCommandMessages[context.guild.id])
                bu.notCommandMessages[context.guild.id] = {};
            bu.notCommandMessages[context.guild.id][context.msg.id] = true;

            try {
                console.log(msg);
                if (msg) {
                    await bot.deleteMessage(msg.channel.id, msg.id);
                }
            } catch (e) {
                console.error(e);
            }
        })
        .build();