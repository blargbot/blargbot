import { CommandType, guard } from '@blargbot/cluster/utils/index.js';
import moment from 'moment-timezone';

import type { CommandContext } from '../../command/index.js';
import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.timer;

export class TimerCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'timer',
            aliases: ['stopwatch'],
            category: CommandType.GENERAL,
            flags: [
                { flag: 'c', word: 'channel', description: cmd.flags.channel }
            ],
            definitions: [
                {
                    parameters: '{duration:duration+}',
                    description: cmd.default.description,
                    execute: (ctx, [duration], { c: channel }) => this.addTimer(ctx, duration.asDuration, channel !== undefined)
                }
            ]
        });
    }

    public async addTimer(context: CommandContext, duration: moment.Duration, inChannel: boolean): Promise<CommandResult> {
        if (duration.asMilliseconds() <= 0)
            return cmd.default.durationZero;

        const channel = inChannel && guard.isGuildCommandContext(context) ? context.channel : await context.author.getDMChannel();
        const source = inChannel && guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;

        await context.cluster.timeouts.insert('timer', {
            source: source,
            user: context.author.id,
            channel: channel.id,
            endtime: moment().add(duration).valueOf()
        });

        return channel.id === context.channel.id
            ? cmd.default.success.here({ duration })
            : cmd.default.success.dm({ duration });
    }

}
