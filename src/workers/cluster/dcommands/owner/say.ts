import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';
import { guard } from '@core/utils';

export class SayCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'say',
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: '{channelId} {text+}',
                    description: 'Sends `text` to the given channel',
                    execute: (ctx, [channel, text]) => this.say(ctx, channel, text)
                },
                {
                    parameters: 'here {text+}',
                    description: 'Sends `text` to this channel',
                    execute: (ctx, [text]) => this.say(ctx, ctx.channel.id, text)
                }
            ]
        });
    }

    public async say(context: CommandContext, channelId: string, text: string): Promise<string | undefined> {
        const channel = await context.util.getChannel(channelId);
        if (channel === undefined)
            return this.error('That channel doesnt exist or it isnt cached');

        if (!guard.isTextableChannel(channel))
            return this.error(`You cant send messages to ${channel.toString()}`);

        await context.send(channel.id, text);
        return undefined;
    }
}
