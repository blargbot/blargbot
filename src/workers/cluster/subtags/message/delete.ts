import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { guard, SubtagType } from '@cluster/utils';
import { Message } from 'discord.js';

export class DeleteSubtag extends Subtag {
    public constructor() {
        super({
            name: 'delete',
            desc: 'Only ccommands can delete other messages.',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: 'Deletes the message that invoked the command',
                    exampleIn: '{//;The message that triggered this will be deleted} {delete}',
                    exampleOut: '(the message got deleted idk how to do examples for this)',
                    execute: (ctx) => this.deleteMessage(ctx, ctx.channel.id, ctx.message.id)
                },
                {
                    parameters: ['messageId'],
                    description: 'Deletes the specified `messageId` from the current channel.',
                    exampleIn: '{//;The message with ID `111111111111111111` will be deleted}\n{delete;111111111111111111}',
                    exampleOut: '(the message `111111111111111111` got deleted idk how to do examples for this)',
                    execute: (ctx, [{ value: msgId }]) => this.deleteMessage(ctx, ctx.channel.id, msgId)
                },
                {
                    parameters: ['channel', 'messageId'],
                    description: 'Deletes the specified `messageId` from channel `channel`.',
                    exampleIn: '{//;The message with ID `2222222222222222` from channel `1111111111111111` will be deleted}\n{delete;111111111111111111;2222222222222222}',
                    exampleOut: '(the message `2222222222222222` from channel `1111111111111111` got deleted)',
                    execute: (ctx, args) => this.deleteMessage(ctx, args[0].value, args[1].value)
                }
            ]
        });
    }

    public async deleteMessage(
        context: BBTagContext,
        channelStr: string,
        messageId: string
    ): Promise<string | void> {
        if (!(await context.isStaff || context.ownsMessage(messageId)))
            throw new BBTagRuntimeError('Author must be staff to delete unrelated messages');

        const channel = await context.queryChannel(channelStr);
        let msg: Message | undefined;
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        if (messageId.length > 0 && guard.isTextableChannel(channel)) {
            msg = await context.util.getMessage(channel.id, messageId);
            if (msg === undefined)
                throw new MessageNotFoundError(channel, messageId);
        } else {
            throw new MessageNotFoundError(channel, messageId);
        }

        /**
         * * This was used in messageDelete event? Not sure what it's purpose is tbh.
         * * bu.commandMessages seems to also be a thing
         */
        // if (!bu.notCommandMessages[context.guild.id])
        //     bu.notCommandMessages[context.guild.id] = {};
        // bu.notCommandMessages[context.guild.id][context.msg.id] = true;

        try {
            await msg.delete();
        } catch (e: unknown) {
            // NO-OP
        }
        //TODO return something like true/false
    }
}
