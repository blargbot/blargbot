import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';
import { guard } from '@core/utils';

export class DeleteMessageCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'deletemsg',
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: '{channelid:bigint?} {messageid:bigint}',
                    description: 'Deletes a message from the given channel, if it was my message',
                    execute: (ctx, [channelId, messageId]) => this.deleteMessage(ctx, channelId ?? ctx.channel.id, messageId)
                }
            ]
        });
    }

    public async deleteMessage(context: CommandContext, channelId: string | bigint, messageId: bigint): Promise<string> {
        if (typeof channelId === 'string')
            channelId = BigInt(channelId);

        const channel = await context.util.getChannel(channelId.toString());
        if (channel === undefined)
            return this.error('I cant find that channel');

        if (!guard.isTextableChannel(channel))
            return this.error(`Messages cant be sent in ${channel.toString()}`);

        const message = await context.util.getMessage(channel, messageId.toString());
        if (message === undefined)
            return this.error('I cannot find that message');

        if (message.author.id !== context.discord.user.id)
            return this.error('That isnt my message');

        await message.delete();
        return this.success('Message deleted');
    }
}
