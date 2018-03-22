/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:31:02
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:31:02
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

async function deleteMessage(subtag, context, channelId, messageId) {
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

    try {
        if (msg != null)
            msg.delete();
    } catch (e) {
    }
}

module.exports =
    Builder.AutoTag('delete')
        .requireStaff()
        .withArgs(a => a.optional([a.optional('channelId'), a.require('messageId')]))
        .withDesc('Deletes the specified `messageId` from `channelId`, defaulting to the message that invoked the command. ' +
            'If `channelId` is not provided, it defaults to the current channel. ' +
            'Only ccommands can delete other messages.')
        .withExample(
            'The message that triggered this will be deleted. {delete}',
            '(the message got deleted idk how to do examples for this)'
        )
        .whenArgs('0', async (subtag, context, args) => await deleteMessage(subtag, context, context.channel.id, context.msg.id))
        .whenArgs('1', async (subtag, context, args) => await deleteMessage(subtag, context, context.channel.id, args[0]))
        .whenArgs('2', async (subtag, context, args) => await deleteMessage(subtag, context, args[0], args[1]))
        .whenDefault(Builder.errors.tooManyArguments)
        .build();