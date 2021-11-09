import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { ChannelNotFoundError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { SubtagCall } from '@cluster/types';
import { guard, SubtagType } from '@cluster/utils';
import { Message } from 'discord.js';

export class DeleteSubtag extends BaseSubtag {
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
                    execute: (ctx, _, subtag) => this.deleteMessage(ctx, ctx.channel.id, ctx.message.id, subtag)
                },
                {
                    parameters: ['messageId'],
                    description: 'Deletes the specified `messageId` from the current channel.',
                    exampleIn: '{//;The message with ID `111111111111111111` will be deleted}\n{delete;111111111111111111}',
                    exampleOut: '(the message `111111111111111111` got deleted idk how to do examples for this)',
                    execute: (ctx, [{ value: msgId }], subtag) => this.deleteMessage(ctx, ctx.channel.id, msgId, subtag)
                },
                {
                    parameters: ['channel', 'messageId'],
                    description: 'Deletes the specified `messageId` from channel `channel`.',
                    exampleIn: '{//;The message with ID `2222222222222222` from channel `1111111111111111` will be deleted}\n{delete;111111111111111111;2222222222222222}',
                    exampleOut: '(the message `2222222222222222` from channel `1111111111111111` got deleted)',
                    execute: (ctx, args, subtag) => this.deleteMessage(ctx, args[0].value, args[1].value, subtag)
                }
            ]
        });
    }

    public async deleteMessage(
        context: BBTagContext,
        channelStr: string,
        messageId: string,
        subtag: SubtagCall
    ): Promise<string | void> {
        if (!(await context.isStaff || context.ownsMessage(messageId)))
            return this.customError('Author must be staff to delete unrelated messages', context, subtag);

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
