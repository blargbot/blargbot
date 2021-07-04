import { Message } from 'eris';
import { BaseSubtag, BBTagContext, SubtagCall, SubtagType } from '../core';
import { guard } from '../core/globalCore';

export class DeleteSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'delete',
            desc: 'Only ccommands can delete other messages.',
            category: SubtagType.COMPLEX,
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

        const channel = await context.getChannel(channelStr);
        let msg: Message | undefined;
        if (channel === undefined)
            return this.channelNotFound(context, subtag);
        if (messageId.length > 0 && guard.isTextableChannel(channel)) {
            try {
                msg = await context.discord.getMessage(channel.id, messageId);
            } catch (err: unknown) {
                return this.noMessageFound(context, subtag);
            }
        } else {
            return this.noMessageFound(context, subtag, 'messageId is empty');
        }
        /**
         * * This was used in messageDelete event? Not sure what it's purpose is tbh.
         * * bu.commandMessages seems to also be a thing
         */
        // if (!bu.notCommandMessages[context.guild.id])
        //     bu.notCommandMessages[context.guild.id] = {};
        // bu.notCommandMessages[context.guild.id][context.msg.id] = true;

        //TODO return something like true/false
        try {
            await context.discord.deleteMessage(msg.channel.id, msg.id);
        } catch (e: unknown) {
            // NO-OP
        }
    }
}
