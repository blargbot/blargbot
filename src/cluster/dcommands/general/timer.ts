import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, guard } from '@blargbot/cluster/utils';
import moment, { Duration } from 'moment-timezone';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.timer;

export class TimerCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `timer`,
            aliases: [`stopwatch`],
            category: CommandType.GENERAL,
            flags: [
                { flag: `c`, word: `channel`, description: cmd.flags.channel }
            ],
            definitions: [
                {
                    parameters: `{duration:duration+}`,
                    description: cmd.default.description,
                    execute: (ctx, [duration], { c: channel }) => this.addTimer(ctx, duration.asDuration, channel !== undefined)
                }
            ]
        });
    }

    public async addTimer(context: CommandContext, duration: Duration, inChannel: boolean): Promise<CommandResult> {
        if (duration.asMilliseconds() <= 0)
            return `❌ I cant set a timer for 0 seconds!`;

        const channel = inChannel && guard.isGuildCommandContext(context) ? context.channel : await context.author.getDMChannel();
        const source = inChannel && guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;

        await context.cluster.timeouts.insert(`timer`, {
            source: source,
            user: context.author.id,
            channel: channel.id,
            endtime: moment().add(duration).valueOf()
        });

        return `✅ Ok, ill ping you ${channel === context.channel ? `here` : `in a DM`} <t:${moment().add(duration).unix()}:R>`;
    }

}
