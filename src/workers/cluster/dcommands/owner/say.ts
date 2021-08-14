import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';
import { guard } from '@core/utils';
import { AllChannels } from 'discord.js';

export class SayCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'say',
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: '{channel:channel} {text+}',
                    description: 'Sends `text` to the given channel',
                    execute: (ctx, [channel, text]) => this.say(ctx, channel, text)
                },
                {
                    parameters: 'here {text+}',
                    description: 'Sends `text` to this channel',
                    execute: (ctx, [text]) => this.say(ctx, ctx.channel, text)
                }
            ]
        });
    }

    public async say(context: CommandContext, channel: AllChannels, text: string): Promise<void> {
        if (!guard.isTextableChannel(channel))
            await context.reply(`You cant send messages to ${channel.toString()}`);

        await context.send(channel.id, text);
    }
}
